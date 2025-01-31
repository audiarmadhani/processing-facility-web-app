import * as React from 'react';
import Typography from '@mui/material/Typography';
import { Link } from '@mui/material'; // Import Link from Material-UI

export default function PaymentPage() {
  return (
    <div>
      <Typography variant="h5">
        Nothing to show here really. Maybe go to one of this links?
      </Typography>
      <Typography>
        {/* Create links to the specified routes */}
        <ul>
          <li>
            <Link href="https://kopifabriek-platform.vercel.app/finance/payment">Payment Station</Link>
          </li>
        </ul>
      </Typography>
    </div>
  );
}