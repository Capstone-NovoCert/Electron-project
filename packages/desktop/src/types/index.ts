// 타입 정의
export interface DecoyParams {
  input_dir: string;
  output_dir: string;
  precursor_tolerance: string;
  random_seed: string;
  memory: string;
}

export interface DecoyResult {
  success: boolean;
  java_version_error?: boolean;
  message: string;
  output?: string;
  error?: string;
}

export interface DenovoParams {
  target_spectra_dir: string;
  decoy_spectra_dir: string;
  casanovo_yaml_path: string;
  casanovo_model_path: string;
}

export interface DenovoResult {
  success: boolean;
  python_module_error?: boolean;
  message: string;
  output?: string;
  error?: string;
}

export interface FileReadResult {
  success: boolean;
  content?: string;
  error?: string;
}

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
