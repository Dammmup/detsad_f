import React from 'react';
import { Button } from '@mui/material';


import { Typography } from '@mui/material';

export default function PageTitle(props: any) {
  return (
    <div>
      <Typography variant='h1'>{props.title}</Typography>
      {props.button && (
        <Button variant='contained' size='large' color='secondary'>
          {props.button}
        </Button>
      )}
    </div>
  );
}
