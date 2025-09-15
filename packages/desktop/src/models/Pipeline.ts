import { createDatabase } from '../database/memory-db';

export interface PipelineParams {
  input_dir: string;
  output_dir: string;
  precursor_tolerance: string;
  random_seed: string;
  memory: string;
}

export interface PipelineExecution {
  id: string;
  pipelineType: 'decoy' | 'denovo' | 'fdr' | 'percolator' | 'pif' | 'post' | 'sa';
  params: PipelineParams;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class PipelineModel {
  private static readonly db = createDatabase('json'); // JSON 데이터베이스 사용

  /**
   * 새로운 파이프라인 실행 생성
   */
  static async create(pipelineType: PipelineExecution['pipelineType'], params: PipelineParams): Promise<PipelineExecution> {
    const execution = {
      pipelineType,
      params,
      status: 'pending' as const
    };

    return await this.db.create(pipelineType, execution) as PipelineExecution;
  }

  /**
   * ID로 파이프라인 실행 조회 (모든 타입에서 검색)
   */
  static async findById(id: string): Promise<PipelineExecution | null> {
    // 모든 파이프라인 타입에서 검색
    const pipelineTypes: PipelineExecution['pipelineType'][] = [
      'decoy', 'denovo', 'fdr', 'percolator', 'pif', 'post', 'sa'
    ];

    for (const type of pipelineTypes) {
      const result = await this.db.findById(type, id);
      if (result) {
        return result as PipelineExecution;
      }
    }

    return null;
  }

  /**
   * 모든 파이프라인 실행 조회 (모든 타입 통합)
   */
  static async findAll(): Promise<PipelineExecution[]> {
    const allExecutions: PipelineExecution[] = [];
    
    // 모든 파이프라인 타입에서 조회
    const pipelineTypes: PipelineExecution['pipelineType'][] = [
      'decoy', 'denovo', 'fdr', 'percolator', 'pif', 'post', 'sa'
    ];

    for (const type of pipelineTypes) {
      const executions = await this.db.findAll(type);
      allExecutions.push(...(executions as PipelineExecution[]));
    }

    // 생성 시간 기준으로 정렬
    return allExecutions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * 파이프라인 상태 업데이트
   */
  static async updateStatus(
    id: string, 
    status: PipelineExecution['status'], 
    result?: any, 
    error?: string
  ): Promise<PipelineExecution | null> {
    const updateData: Partial<PipelineExecution> = {
      status,
      result,
      error
    };

    if (status === 'running') {
      updateData.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    // 먼저 해당 ID가 어느 타입에 속하는지 찾기
    const pipelineTypes: PipelineExecution['pipelineType'][] = [
      'decoy', 'denovo', 'fdr', 'percolator', 'pif', 'post', 'sa'
    ];

    for (const type of pipelineTypes) {
      const existing = await this.db.findById(type, id);
      if (existing) {
        return await this.db.update(type, id, updateData) as PipelineExecution;
      }
    }

    return null;
  }

  /**
   * 특정 타입의 파이프라인 실행 조회
   */

  static async findByType(pipelineType: PipelineExecution['pipelineType']): Promise<PipelineExecution[]> {
    return await this.db.findAll(pipelineType) as PipelineExecution[];
  }

  /**
   * 파이프라인 실행 삭제
   */
  static async delete(id: string): Promise<boolean> {
    // 먼저 해당 ID가 어느 타입에 속하는지 찾기
    const pipelineTypes: PipelineExecution['pipelineType'][] = [
      'decoy', 'denovo', 'fdr', 'percolator', 'pif', 'post', 'sa'
    ];

    for (const type of pipelineTypes) {
      const existing = await this.db.findById(type, id);
      if (existing) {
        return await this.db.delete(type, id);
      }
    }

    return false;
  }
}
