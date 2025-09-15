/**
 * JSON 파일 기반 데이터베이스
 * 메모리 데이터베이스와 동일한 인터페이스를 제공하되, JSON 파일에 영구 저장
 */

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseInterface } from './memory-db';

export class JsonDatabase implements DatabaseInterface {
  private data: Record<string, Record<string, any>> = {};
  private baseDbPath: string;
  private loadedFiles: Set<string> = new Set();

  constructor(baseDbPath?: string) {
    // 기본 DB 파일 경로 설정
    this.baseDbPath = baseDbPath || path.join(__dirname, '../../../data');
    
    // DB 파일이 있는 디렉토리 생성
    if (!fs.existsSync(this.baseDbPath)) {
      fs.mkdirSync(this.baseDbPath, { recursive: true });
    }
  }

  /**
   * 특정 테이블(파이프라인 타입)의 JSON 파일에서 데이터 로드
   */
  private loadTableFromFile(table: string): void {
    const filePath = this.getTableFilePath(table);
    
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const tableData = JSON.parse(fileContent);
        this.data[table] = tableData;
        this.loadedFiles.add(table);
        console.log(`${table} 테이블 로드 완료:`, filePath);
      } else {
        console.log(`${table} 테이블 파일이 없습니다. 새로 생성합니다.`);
        this.data[table] = {};
        this.loadedFiles.add(table);
      }
    } catch (error) {
      console.error(`${table} 테이블 로드 실패:`, error);
      this.data[table] = {};
      this.loadedFiles.add(table);
    }
  }

  /**
   * 테이블명으로 파일 경로 생성
   */
  private getTableFilePath(table: string): string {
    // 테이블명을 파일명으로 변환 (예: 'pipelines' -> 'pipeline-db.json')
    const fileName = `${table}-db.json`;
    return path.join(this.baseDbPath, fileName);
  }

  /**
   * 특정 테이블의 데이터를 JSON 파일에 저장
   */
  private saveTableToFile(table: string): void {
    try {
      const filePath = this.getTableFilePath(table);
      const jsonString = JSON.stringify(this.data[table] || {}, null, 2);
      fs.writeFileSync(filePath, jsonString, 'utf8');
      console.log(`${table} 테이블 저장 완료:`, filePath);
    } catch (error) {
      console.error(`${table} 테이블 저장 실패:`, error);
      throw error;
    }
  }

  /**
   * 새로운 레코드 생성
   */
  async create<T>(table: string, data: T): Promise<T & { id: string }> {
    // 테이블이 로드되지 않았다면 로드
    if (!this.loadedFiles.has(table)) {
      this.loadTableFromFile(table);
    }

    if (!this.data[table]) {
      this.data[table] = {};
    }

    const id = this.generateId();
    const record = { 
      ...data, 
      id, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    };
    
    // output 필드 제거 (큰 텍스트 데이터이므로 JSON에 저장하지 않음)
    const cleanedRecord = this.removeLargeFields(record);
    
    this.data[table][id] = cleanedRecord;
    
    // 해당 테이블 파일에 저장
    this.saveTableToFile(table);
    
    return record; // 원본 레코드 반환 (output 포함)
  }

  /**
   * ID로 레코드 조회
   */
  async findById<T>(table: string, id: string): Promise<T | null> {
    // 테이블이 로드되지 않았다면 로드
    if (!this.loadedFiles.has(table)) {
      this.loadTableFromFile(table);
    }

    if (!this.data[table] || !this.data[table][id]) {
      return null;
    }
    
    const record = this.data[table][id];
    // JSON에서 로드된 날짜 문자열을 Date 객체로 변환
    return this.parseDates(record) as T;
  }

  /**
   * 모든 레코드 조회
   */
  async findAll<T>(table: string): Promise<T[]> {
    // 테이블이 로드되지 않았다면 로드
    if (!this.loadedFiles.has(table)) {
      this.loadTableFromFile(table);
    }

    if (!this.data[table]) {
      return [];
    }
    
    const records = Object.values(this.data[table]);
    // 모든 레코드의 날짜 필드를 Date 객체로 변환
    return records.map(record => this.parseDates(record)) as T[];
  }

  /**
   * 레코드 업데이트
   */
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    // 테이블이 로드되지 않았다면 로드
    if (!this.loadedFiles.has(table)) {
      this.loadTableFromFile(table);
    }

    if (!this.data[table] || !this.data[table][id]) {
      return null;
    }

    const updatedRecord = {
      ...this.data[table][id],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    // output 필드 제거하여 저장
    const cleanedRecord = this.removeLargeFields(updatedRecord);
    this.data[table][id] = cleanedRecord;
    
    // 해당 테이블 파일에 저장
    this.saveTableToFile(table);
    
    return this.parseDates(updatedRecord) as T; // 원본 반환 (output 포함)
  }

  /**
   * 레코드 삭제
   */
  async delete(table: string, id: string): Promise<boolean> {
    // 테이블이 로드되지 않았다면 로드
    if (!this.loadedFiles.has(table)) {
      this.loadTableFromFile(table);
    }

    if (!this.data[table] || !this.data[table][id]) {
      return false;
    }

    delete this.data[table][id];
    
    // 해당 테이블 파일에 저장
    this.saveTableToFile(table);
    
    return true;
  }

  /**
   * 큰 필드들(output 등)을 제거하여 JSON 저장 시 파일 크기 최적화
   */
  private removeLargeFields(record: any): any {
    if (!record || typeof record !== 'object') {
      return record;
    }

    const cleaned = { ...record };
    
    // result 객체에서 output 필드 제거
    if (cleaned.result && typeof cleaned.result === 'object') {
      const { output, ...resultWithoutOutput } = cleaned.result;
      cleaned.result = {
        ...resultWithoutOutput,
        // output이 있었음을 표시
        hasOutput: output !== undefined && output !== null
      };
    }
    
    return cleaned;
  }

  /**
   * JSON에서 로드된 날짜 문자열을 Date 객체로 변환
   */
  private parseDates(record: any): any {
    if (!record || typeof record !== 'object') {
      return record;
    }

    const parsed = { ...record };
    
    // 날짜 필드들을 Date 객체로 변환
    if (parsed.createdAt && typeof parsed.createdAt === 'string') {
      parsed.createdAt = new Date(parsed.createdAt);
    }
    if (parsed.updatedAt && typeof parsed.updatedAt === 'string') {
      parsed.updatedAt = new Date(parsed.updatedAt);
    }
    if (parsed.startedAt && typeof parsed.startedAt === 'string') {
      parsed.startedAt = new Date(parsed.startedAt);
    }
    if (parsed.completedAt && typeof parsed.completedAt === 'string') {
      parsed.completedAt = new Date(parsed.completedAt);
    }

    return parsed;
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 디버깅용: 전체 데이터 조회
   */
  getAllData(): Record<string, Record<string, any>> {
    return this.data;
  }

  /**
   * 디버깅용: 특정 테이블 데이터 조회
   */
  getTableData(table: string): Record<string, any> {
    return this.data[table] || {};
  }

  /**
   * 데이터베이스 파일 경로 조회
   */
  getDbPath(): string {
    return this.baseDbPath;
  }

  /**
   * 데이터베이스 초기화 (모든 데이터 삭제)
   */
  async clear(): Promise<void> {
    this.data = {};
    // 모든 로드된 테이블 파일을 저장
    for (const table of this.loadedFiles) {
      this.saveTableToFile(table);
    }
  }

  /**
   * 백업 파일 생성
   */
  async backup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = backupPath || path.join(this.baseDbPath, `backup-${timestamp}`);
    
    // 백업 디렉토리 생성
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 모든 로드된 테이블 파일을 백업
    for (const table of this.loadedFiles) {
      const sourceFile = this.getTableFilePath(table);
      const backupFile = path.join(backupDir, `${table}-db.json`);
      
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, backupFile);
      }
    }
    
    console.log('데이터베이스 백업 완료:', backupDir);
    return backupDir;
  }
}

