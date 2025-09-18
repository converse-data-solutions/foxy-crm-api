import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'countries' })
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    name: 'name',
  })
  name: string;

  @Column({
    type: 'char',
    length: 2,
    unique: true,
    name: 'iso_code_2',
  })
  isoCode2: string;

  @Column({
    type: 'char',
    length: 3,
    unique: true,
    name: 'iso_code_3',
  })
  isoCode3: string;

  @Column({ type: 'varchar', length: 10, name: 'phone_code' })
  phoneCode: string;

  @Column('text', { name: 'flag_image' })
  flagImage: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
