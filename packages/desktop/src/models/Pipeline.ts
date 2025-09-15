import { memoryDB } from '../database/memory-db';

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
  private static readonly TABLE_NAME = 'pipelines';

  /**
   * 새로운 파이프라인 실행 생성
   */
  static async create(pipelineType: PipelineExecution['pipelineType'], params: PipelineParams): Promise<PipelineExecution> {
    const execution = {
      pipelineType,
      params,
      status: 'pending' as const
    };

    return await memoryDB.create(this.TABLE_NAME, execution) as PipelineExecution;
  }

  /**
   * ID로 파이프라인 실행 조회
   */
  static async findById(id: string): Promise<PipelineExecution | null> {
    return await memoryDB.findById(this.TABLE_NAME, id);
  }

  /**
   * 모든 파이프라인 실행 조회
   */
  static async findAll(): Promise<PipelineExecution[]> {
    return await memoryDB.findAll(this.TABLE_NAME);
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

    return await memoryDB.update(this.TABLE_NAME, id, updateData);
  }

  /**
   * 특정 타입의 파이프라인 실행 조회
   */
  static async findByType(pipelineType: PipelineExecution['pipelineType']): Promise<PipelineExecution[]> {
    const allPipelines = await this.findAll();
    return allPipelines.filter(pipeline => pipeline.pipelineType === pipelineType);
  }

  /**
   * 파이프라인 실행 삭제
   */
  static async delete(id: string): Promise<boolean> {
    return await memoryDB.delete(this.TABLE_NAME, id);
  }
}
