export interface Grave {
  id: string
  user_id: string
  name: string
  relation: string
  note: string | null
  latitude: number
  longitude: number
  accuracy: number | null
  photo_url: string | null
  share_code: string
  created_at: string
  updated_at: string
}

export interface GraveInsert {
  name: string
  relation: string
  note?: string | null
  latitude: number
  longitude: number
  accuracy?: number | null
  photo_url?: string | null
}

export interface Database {
  public: {
    Tables: {
      graves: {
        Row: Grave
        Insert: Omit<Grave, 'id' | 'created_at' | 'updated_at' | 'share_code' | 'user_id'>
        Update: Partial<Omit<Grave, 'id' | 'created_at' | 'user_id' | 'share_code'>>
      }
    }
  }
}

export const RELATIONS = [
  '爷爷',
  '奶奶',
  '外公',
  '外婆',
  '父亲',
  '母亲',
  '伯父',
  '伯母',
  '叔叔',
  '婶婶',
  '姑姑',
  '姑父',
  '舅舅',
  '舅妈',
  '姨妈',
  '姨父',
  '哥哥',
  '嫂子',
  '姐姐',
  '姐夫',
  '其他',
] as const
