export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '13.0.5'
    }
    public: {
        Tables: {
            chat_sessions: {
                Row: {
                    created_at: string | null
                    id: string
                    title: string
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id: string
                    title: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    title?: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            function_calls: {
                Row: {
                    arguments: Json
                    created_at: string | null
                    id: number
                    message_id: string | null
                    name: string
                }
                Insert: {
                    arguments: Json
                    created_at?: string | null
                    id?: number
                    message_id?: string | null
                    name: string
                }
                Update: {
                    arguments?: Json
                    created_at?: string | null
                    id?: number
                    message_id?: string | null
                    name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'function_calls_message_id_fkey'
                        columns: ['message_id']
                        isOneToOne: false
                        referencedRelation: 'messages'
                        referencedColumns: ['id']
                    }
                ]
            }
            function_responses: {
                Row: {
                    created_at: string | null
                    id: number
                    message_id: string | null
                    name: string
                    response: Json
                }
                Insert: {
                    created_at?: string | null
                    id?: number
                    message_id?: string | null
                    name: string
                    response: Json
                }
                Update: {
                    created_at?: string | null
                    id?: number
                    message_id?: string | null
                    name?: string
                    response?: Json
                }
                Relationships: [
                    {
                        foreignKeyName: 'function_responses_message_id_fkey'
                        columns: ['message_id']
                        isOneToOne: false
                        referencedRelation: 'messages'
                        referencedColumns: ['id']
                    }
                ]
            }
            mcp_servers: {
                Row: {
                    args: string[] | null
                    command: string | null
                    connected: boolean | null
                    created_at: string | null
                    description: string | null
                    enabled: boolean | null
                    env: Json | null
                    error_message: string | null
                    headers: Json | null
                    id: string
                    last_connected: string | null
                    name: string
                    status: string | null
                    transport: string
                    updated_at: string | null
                    url: string | null
                    user_id: string | null
                }
                Insert: {
                    args?: string[] | null
                    command?: string | null
                    connected?: boolean | null
                    created_at?: string | null
                    description?: string | null
                    enabled?: boolean | null
                    env?: Json | null
                    error_message?: string | null
                    headers?: Json | null
                    id: string
                    last_connected?: string | null
                    name: string
                    status?: string | null
                    transport: string
                    updated_at?: string | null
                    url?: string | null
                    user_id?: string | null
                }
                Update: {
                    args?: string[] | null
                    command?: string | null
                    connected?: boolean | null
                    created_at?: string | null
                    description?: string | null
                    enabled?: boolean | null
                    env?: Json | null
                    error_message?: string | null
                    headers?: Json | null
                    id?: string
                    last_connected?: string | null
                    name?: string
                    status?: string | null
                    transport?: string
                    updated_at?: string | null
                    url?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            messages: {
                Row: {
                    content: string
                    id: string
                    is_streaming: boolean | null
                    sender: string
                    session_id: string | null
                    timestamp: string | null
                    user_id: string | null
                }
                Insert: {
                    content: string
                    id: string
                    is_streaming?: boolean | null
                    sender: string
                    session_id?: string | null
                    timestamp?: string | null
                    user_id?: string | null
                }
                Update: {
                    content?: string
                    id?: string
                    is_streaming?: boolean | null
                    sender?: string
                    session_id?: string | null
                    timestamp?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'messages_session_id_fkey'
                        columns: ['session_id']
                        isOneToOne: false
                        referencedRelation: 'chat_sessions'
                        referencedColumns: ['id']
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
          DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
          DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
          Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
          Insert: infer I
      }
        ? I
        : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
          Update: infer U
      }
        ? U
        : never
    : never

export const Constants = {
    public: {
        Enums: {}
    }
} as const
