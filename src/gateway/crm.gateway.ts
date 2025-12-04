import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService } from 'src/services/token.service';
import * as cookie from 'cookie';
import { forwardRef, Inject } from '@nestjs/common';
import { MetricService } from 'src/services/metric.service';
import { UserService } from 'src/services/user.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { REDIS_CONFIG } from 'src/shared/utils/config.util';

const redisClient = new Redis({
  host: REDIS_CONFIG.host,
  port: REDIS_CONFIG.port,
  password: REDIS_CONFIG.password,
});

const connectionLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ws_conn_limit',
  points: 5, // Allow 5 connections
  duration: 60, // Per minute per IP
});

@WebSocketGateway({ cors: { origin: '*', credentials: true } })
export class CrmGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly tokenService: TokenService,
    @Inject(forwardRef(() => MetricService))
    private readonly metricService: MetricService,
    private readonly userService: UserService,
    private readonly loggerService: LoggerService,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
  ) {}
  afterInit(server: Server) {
    this.server = server;
  }
  async handleConnection(client: Socket): Promise<void> {
    const ip = client.handshake.address;

    try {
      await connectionLimiter.consume(ip);
    } catch {
      client.emit('error', { message: 'Too many connection attempts. Please wait a moment.' });
      client.disconnect(true);
      return;
    }
    try {
      const rawCookie = client.handshake.headers.cookie || '';
      const parsedCookie = cookie.parse(rawCookie);
      const token = parsedCookie['access_token'];
      let schema = client.handshake.headers['x-tenant-id'];
      schema = Array.isArray(schema) ? schema[0] : schema;
      if (!schema || !token) {
        throw new WsException('Invalid connection');
      }
      const payload = await this.tokenService.verifyAccessToken(token, true);
      const user = await this.userService.validateUser(payload, schema);

      if (!user) {
        throw new WsException('User not found');
      }

      const subscription = await this.subscriptionRepo.findOne({
        where: { tenant: { schemaName: schema } },
        relations: { tenant: true },
      });

      if (!subscription) {
        client.emit('error', { message: 'Subscription not found' });
        this.loggerService.logError(`No subscription found for ${schema ?? 'unknown user'}`);
        client.disconnect(true);
        return;
      } else if (subscription.status === false) {
        client.emit('error', { message: 'Subscription expired' });
        this.loggerService.logError(
          `Subscription expired for ${subscription?.tenant?.schemaName ?? 'unknown user'}`,
        );
        client.disconnect(true);
        return;
      }

      client.emit('metricUpdates', 'Connection established');
    } catch (error) {
      const message = error instanceof WsException ? error.message : 'Unauthorized';
      client.emit('error', { message });
      this.loggerService.logError(
        `WebSocket connection failed for client ${client.id}: ${message}`,
      );
      client.disconnect(true);
    }
  }
  handleDisconnect(client: Socket) {
    this.loggerService.logError(`Connection terminated for client ${client.id}`);
  }

  @SubscribeMessage('joinTenantRoom')
  async handleJoinTenantRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    client.join(data.tenantId);
    client.emit('metricUpdates', 'Joined room');
  }

  @SubscribeMessage('subscribeToMetric')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    const metricData = await this.metricService.getTenantCounts(data.tenantId);

    client.join(data.tenantId);
    client.emit('metricUpdates', metricData);
  }

  async emitMetricUpdate(tenantId: string) {
    const metricData = await this.metricService.getTenantCounts(tenantId);
    this.server.to(tenantId).emit('metricUpdates', metricData);
  }
}
