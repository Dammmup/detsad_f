import { BaseCrudApiClient } from '../../../shared/utils/api';
import { ProductCertificate } from '../types/productCertificate';
export type { ProductCertificate } from '../types/productCertificate';

class ProductCertificateApiClient extends BaseCrudApiClient<ProductCertificate> {
  protected endpoint = '/product-certificate';
}

export const productCertificateApi = new ProductCertificateApiClient();
