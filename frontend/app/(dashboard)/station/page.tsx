import * as React from 'react';
import Typography from '@mui/material/Typography';
import { Link } from '@mui/material'; // Import Link from Material-UI

export default function OrdersPage() {
  return (
    <div>
      <Typography variant="h5">
        Nothing to show here really. Maybe go to one of this links?
      </Typography>
      <Typography>
        {/* Create links to the specified routes */}
        <ul>
          <li>
            <Link href="https://kopifabriek-platform.vercel.app/station/receivingstation">Receiving Station</Link>
          </li>
          <li>
            <Link href="https://kopifabriek-platform.vercel.app/station/qcstation">Quality Control Station</Link>
          </li>
          <li>
            <Link href="https://kopifabriek-platform.vercel.app/station/preprocessingstation">Preprocessing Station</Link>
          </li>
          <li>
            <Link href="https://kopifabriek-platform.vercel.app/station/postprocessingstation">Postprocessing Station</Link>
          </li>
        </ul>
      </Typography>
    </div>
  );
}