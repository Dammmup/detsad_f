import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface RentReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  data: {
    tenantName: string;
    period: string;
    amount: number;
    paidAmount: number;
    debt: number;
    overpayment: number;
    status: string;
    id?: string;
    paymentDate?: string;
  } | null;
}

const RentReceiptDialog: React.FC<RentReceiptDialogProps> = ({ open, onClose, data }) => {
  if (!data) return null;

  const receiptId = data.id?.slice(-8).toUpperCase() || 'N/A';
  const statusColor = data.status === 'paid' || (data.amount > 0 && data.paidAmount >= data.amount) 
    ? '#2e7d32' 
    : data.status === 'overdue' ? '#d32f2f' : '#e65100';
  
  const statusLabels: Record<string, string> = {
    paid: 'ОПЛАЧЕНО',
    overdue: 'ПРОСРОЧЕНО',
    active: 'АКТИВЕН',
    draft: 'ЧЕРНОВИК'
  };

  const currentStatusLabel = (data.status === 'paid' || (data.amount > 0 && data.paidAmount >= data.amount))
    ? 'ОПЛАЧЕНО'
    : statusLabels[data.status] || 'АКТИВЕН';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Расчетный листок (Аренда)</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#f5f7fa', p: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          position: 'relative',
          pb: 2,
          fontFamily: '"Courier New", Courier, monospace',
          color: '#000'
        }}>
          {/* Серрейторный край сверху */}
          <Box sx={{
            height: 12,
            width: '100%',
            background: '#fff',
            clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)',
            position: 'absolute',
            top: -12,
            zIndex: 1
          }} />

          <Box sx={{ p: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', borderBottom: '2px solid #000', pb: 1, display: 'inline-block' }}>ALDAMIRAM</Typography>
              <Typography sx={{ display: 'block', mt: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>КВИТАНЦИЯ ОБ ОПЛАТЕ АРЕНДЫ</Typography>
              <Typography sx={{ fontSize: '0.7rem', opacity: 0.8 }}>{new Date().toLocaleString()}</Typography>
            </Box>

            <Box sx={{ mb: 2, borderBottom: '1px dashed #000', pb: 1 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>АРЕНДАТОР: {data.tenantName}</Typography>
              <Typography sx={{ fontSize: '0.8rem' }}>ПЕРИОД: {data.period}</Typography>
            </Box>

            <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, mb: 1 }}>ДЕТАЛИ ПЛАТЕЖА:</Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.8rem' }}>СУММА АРЕНДЫ / RENT AMOUNT</Typography>
                <Typography sx={{ fontSize: '0.8rem' }}>{data.amount.toLocaleString()} ₸</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px dotted #ccc' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>ОПЛАЧЕНО / PAID</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2e7d32' }}>+{data.paidAmount.toLocaleString()} ₸</Typography>
              </Box>

              {data.debt > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#d32f2f' }}>ДОЛГ / DEBT</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#d32f2f' }}>{data.debt.toLocaleString()} ₸</Typography>
                </Box>
              )}

              {data.overpayment > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#2e7d32' }}>ПЕРЕПЛАТА / OVERPAYMENT</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#2e7d32' }}>{data.overpayment.toLocaleString()} ₸</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ borderTop: '2px solid #000', pt: 1, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>ИТОГО К ОПЛАТЕ:</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.6rem' }}>{Math.max(0, data.amount - data.paidAmount).toLocaleString()} ₸</Typography>
            </Box>

            <Box sx={{ position: 'relative', mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{
                border: '4px double',
                p: 1,
                transform: 'rotate(-15deg)',
                color: statusColor,
                borderColor: statusColor,
                fontWeight: 900,
                textTransform: 'uppercase',
                fontSize: '1.2rem',
                letterSpacing: 4,
                opacity: 0.8
              }}>
                {currentStatusLabel}
              </Box>
            </Box>

            <Box sx={{ mt: 5, textAlign: 'center', opacity: 0.4 }}>
              <Box sx={{
                height: 30,
                width: '100%',
                background: 'repeating-linear-gradient(90deg, #000, #000 1px, transparent 1px, transparent 3px, #000 3px, #000 5px, transparent 5px, transparent 6px)',
                mb: 0.5
              }} />
              <Typography sx={{ fontSize: '0.5rem' }}>DOCID: {receiptId} | AUTH_SIG_VALID</Typography>
            </Box>
          </Box>

          {/* Серрейторный край снизу */}
          <Box sx={{
            height: 12,
            width: '100%',
            background: '#fff',
            clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)',
            position: 'absolute',
            bottom: -12,
            zIndex: 1
          }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => window.print()} variant="outlined" color="primary">Печать</Button>
        <Button onClick={onClose} color="primary">Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RentReceiptDialog;
