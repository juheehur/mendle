import { createClient } from '@supabase/supabase-js'

// Supabase API URL과 API 키를 환경 변수에서 가져오거나 기본값을 사용합니다.
// 실제 프로젝트에서는 반드시 환경 변수를 사용하세요.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey) 