export interface Shop {
  storeId: string;
  storeName: string;
  storeAddress: string;
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  docsUrl: string;
  isActive: boolean;
}

export interface IntegrationSettings {
  group_code: string;
  inn: string;
  sno: string;
  default_vat: string;
  company_email: string;
  payment_address: string;
  active_ai_provider: string;
  gigachat_auth_key: string;
  anthropic_api_key: string;
  openrouter_api_key: string;
  openai_api_key: string;
  yandexgpt_api_key: string;
  yandexgpt_folder_id: string;
  ecomkassa_login: string;
  ecomkassa_password: string;
  available_shops: Shop[];
}
