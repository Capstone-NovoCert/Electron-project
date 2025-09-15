/**
 * 메모리 기반 데이터베이스
 * 추후 실제 DB로 교체 가능하도록 인터페이스 기반으로 구현
 */

export interface DatabaseInterface {
  create<T>(table: string, data: T): Promise<T & { id: string }>;
  findById<T>(table: string, id: string): Promise<T | null>;
  findAll<T>(table: string): Promise<T[]>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(table: string, id: string): Promise<boolean>;
}

class MemoryDatabase implements DatabaseInterface {
  private data: Record<string, Record<string, any>> = {};

  async create<T>(table: string, data: T): Promise<T & { id: string }> {
    if (!this.data[table]) {
      this.data[table] = {};
    }

    const id = this.generateId();
    const record = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    this.data[table][id] = record;

    return record;
  }

  async findById<T>(table: string, id: string): Promise<T | null> {
    if (!this.data[table] || !this.data[table][id]) {
      return null;
    }
    return this.data[table][id] as T;
  }

  async findAll<T>(table: string): Promise<T[]> {
    if (!this.data[table]) {
      return [];
    }
    return Object.values(this.data[table]) as T[];
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    if (!this.data[table] || !this.data[table][id]) {
      return null;
    }

    this.data[table][id] = {
      ...this.data[table][id],
      ...data,
      updatedAt: new Date()
    };

    return this.data[table][id] as T;
  }

  async delete(table: string, id: string): Promise<boolean> {
    if (!this.data[table] || !this.data[table][id]) {
      return false;
    }

    delete this.data[table][id];
    return true;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 디버깅용: 전체 데이터 조회
  getAllData(): Record<string, Record<string, any>> {
    return this.data;
  }

  // 디버깅용: 특정 테이블 데이터 조회
  getTableData(table: string): Record<string, any> {
    return this.data[table] || {};
  }
}

// 싱글톤 인스턴스
export const memoryDB = new MemoryDatabase();

// 추후 실제 DB로 교체할 때 사용할 팩토리 함수
export function createDatabase(type: 'memory' | 'sqlite' | 'postgres' = 'memory'): DatabaseInterface {
  switch (type) {
    case 'memory':
      return memoryDB;
    // case 'sqlite':
    //   return new SQLiteDatabase();
    // case 'postgres':
    //   return new PostgreSQLDatabase();
    default:
      return memoryDB;
  }
}
