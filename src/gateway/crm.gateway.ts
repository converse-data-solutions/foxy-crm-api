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
  ) {}
  afterInit(server: Server) {
    this.server = server;
  }
  async handleConnection(client: Socket) {
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
      await this.userService.validateUser(payload, schema);
      client.emit('metricUpdates', 'Connection established');
    } catch (error) {
      client.emit('error', { message: error.message || 'Unauthorized' });
      this.loggerService.logError(`${error.message} for client- ${client.id}`);
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
