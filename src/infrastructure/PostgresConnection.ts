import postgres from 'postgres'
import { config } from '../config/config'

export class PostgresConnection {
  public readonly sql: postgres.Sql

  constructor () {
    this.sql = postgres({
      ...config.db,
      onnotice: () => {}
    })
  }

  async end (): Promise<void> {
    await this.sql.end()
  }
}
