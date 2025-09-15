import { PipelineModel, PipelineParams, PipelineExecution } from '../models/Pipeline';
import { runDecoyProgram } from '../services/DecoyService';
import { runDenovoProgram } from '../services/DenovoService';
import { DenovoParams } from '../types';
import { spawn } from 'child_process';
import * as path from 'path';

export class PipelineController {
  /**
   * Decoy 파이프라인 실행
   */
  static async runDecoy(params: PipelineParams): Promise<{ success: boolean; executionId?: string; message: string; error?: string }> {
    try {
      // 파이프라인 실행 기록 생성
      const execution = await PipelineModel.create('decoy', params);
      
      // 상태를 running으로 업데이트
      await PipelineModel.updateStatus(execution.id, 'running');

      // Decoy 프로그램 실행
      const result = await runDecoyProgram(params);

      if (result.success) {
        // 성공 시 상태 업데이트
        await PipelineModel.updateStatus(execution.id, 'completed', result);
        return {
          success: true,
          executionId: execution.id,
          message: result.message
        };
      } else {
        // 실패 시 상태 업데이트
        await PipelineModel.updateStatus(execution.id, 'failed', null, result.error);
        return {
          success: false,
          executionId: execution.id,
          message: result.message,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Decoy 파이프라인 실행 오류:', error);
      return {
        success: false,
        message: '파이프라인 실행 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * De novo 파이프라인 실행
   */
  static async runDenovo(params: DenovoParams): Promise<{ success: boolean; executionId?: string; message: string; error?: string }> {
    try {
      // 파이프라인 실행 기록 생성
      const execution = await PipelineModel.create('denovo', params as any);
      
      // 상태를 running으로 업데이트
      await PipelineModel.updateStatus(execution.id, 'running');

      // De novo 프로그램 실행
      const result = await runDenovoProgram(params);

      if (result.success) {
        // 성공 시 상태 업데이트
        await PipelineModel.updateStatus(execution.id, 'completed', result);
        return {
          success: true,
          executionId: execution.id,
          message: result.message
        };
      } else {
        // 실패 시 상태 업데이트
        await PipelineModel.updateStatus(execution.id, 'failed', null, result.error);
        return {
          success: false,
          executionId: execution.id,
          message: result.message,
          error: result.error
        };
      }
    } catch (error) {
      console.error('De novo 파이프라인 실행 오류:', error);
      return {
        success: false,
        message: '파이프라인 실행 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 파이프라인 실행 상태 조회
   */
  static async getExecutionStatus(executionId: string): Promise<PipelineExecution | null> {
    return await PipelineModel.findById(executionId);
  }

  /**
   * 모든 파이프라인 실행 기록 조회
   */
  static async getAllExecutions(): Promise<PipelineExecution[]> {
    return await PipelineModel.findAll();
  }

  /**
   * 특정 타입의 파이프라인 실행 기록 조회
   */
  static async getExecutionsByType(pipelineType: PipelineExecution['pipelineType']): Promise<PipelineExecution[]> {
    return await PipelineModel.findByType(pipelineType);
  }

  /**
   * 파이프라인 실행 기록 삭제
   */
  static async deleteExecution(executionId: string): Promise<boolean> {
    return await PipelineModel.delete(executionId);
  }

  /**
   * 특정 타입의 마지막 파이프라인 실행 파라미터 조회
   */
  static async getLastExecutionParams(pipelineType: PipelineExecution['pipelineType']): Promise<PipelineParams | null> {
    const executions = await PipelineModel.findByType(pipelineType);
    
    if (executions.length === 0) {
      return null;
    }

    // 최신 실행 기록 반환 (createdAt 기준 내림차순)
    const sortedExecutions = executions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedExecutions[0].params;
  }

  /**
   * 파이프라인 실행 통계 조회
   */
  static async getExecutionStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const executions = await PipelineModel.findAll();
    
    const stats = {
      total: executions.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };

    executions.forEach(execution => {
      // 상태별 통계
      stats.byStatus[execution.status] = (stats.byStatus[execution.status] || 0) + 1;
      
      // 타입별 통계
      stats.byType[execution.pipelineType] = (stats.byType[execution.pipelineType] || 0) + 1;
    });

    return stats;
  }
}
