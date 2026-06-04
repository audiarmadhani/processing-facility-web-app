import { apiUrl } from '../_shared/config';

export const GB_QC_ALLOWED_ROLES = ['admin', 'manager', 'postprocessing'];

export const gbQcApi = (path) => apiUrl(path);

export const emptyFormData = () => ({
  seranggaHidup: null,
  bijiBauBusuk: null,
  kelembapan: '',
  waterActivity: '',
  triage: '',
  bijiHitam: '',
  bijiHitamSebagian: '',
  bijiHitamPecah: '',
  kopiGelondong: '',
  bijiCoklat: '',
  kulitKopiBesar: '',
  kulitKopiSedang: '',
  kulitKopiKecil: '',
  bijiBerKulitTanduk: '',
  kulitTandukBesar: '',
  kulitTandukSedang: '',
  kulitTandukKecil: '',
  bijiPecah: '',
  bijiMuda: '',
  bijiBerlubangSatu: '',
  bijiBerlubangLebihSatu: '',
  bijiBertutul: '',
  rantingBesar: '',
  rantingSedang: '',
  rantingKecil: '',
  totalBobotKotoran: '',
});
