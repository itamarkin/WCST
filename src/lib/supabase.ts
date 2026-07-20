import { createClient } from '@supabase/supabase-js'

// Use Next.js environment variable syntax
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client only if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey  
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface WCSTResult {
  participant_id?: string | null;
  test_date: string;
  total_trials: number;
  total_correct: number;
  total_errors: number;
  categories_completed: number;
  trials_to_first_category: number | null;
  conceptual_level_responses: number;
  failure_to_maintain_set: number;
  perseverative_responses: number;
  perseverative_errors: number;
  nonperseverative_errors: number;
  percent_errors: number;
  percent_perseverative_responses: number;
  percent_perseverative_errors: number;
  percent_nonperseverative_errors: number;
  percent_conceptual_level_responses: number;
  learning_to_learn: number | null;
  raw_responses: any[];
}

export const saveWCSTResult = async (result: WCSTResult) => {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.')
    }

    const { data, error } = await supabase
      .from('wcst_results')
      .insert([result])
      .select()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error saving WCST result:', error)
    return { success: false, error: error as Error }
  }
}

export const getWCSTResults = async (participantId?: string) => {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.')
    }

    let query = supabase.from('wcst_results').select('*')
    
    if (participantId) {
      query = query.eq('participant_id', participantId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching WCST results:', error)
    return { success: false, error: error as Error }
  }
}
