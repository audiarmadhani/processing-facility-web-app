import { apiUrl } from '../_shared/config';

export const GB_QC_ALLOWED_ROLES = ['admin', 'manager', 'postprocessing'];

export const gbQcApi = (path) => apiUrl(path);

export const emptyFormData = () => ({
  tastingNotes: '',
  okForFurtherProcess: null,
  seranggaHidup: null,
  bijiBauBusuk: null,
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
