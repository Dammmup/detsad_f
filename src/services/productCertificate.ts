import { BaseCrudApiClient } from '../utils/api';

export interface ProductCertificate {
  _id?: string;
  date: string;
  product: string;
  certificateNumber: string;
  issuedBy: string;
  expiry: string;
  notes?: string;
}

class ProductCertificateApiClient extends BaseCrudApiClient<ProductCertificate> {
  protected endpoint = '/api/product-certificate';
}

export const productCertificateApi = new ProductCertificateApiClient();
