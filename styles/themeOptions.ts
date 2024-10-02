import { ThemeOptions } from "@mui/material";
import { ButtonPropsVariantOverrides } from "@mui/material/Button";

// ButtonPropsVariantOverrides を拡張
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    clearConversations: true;
  }
}

export const themeOptions:ThemeOptions = {
  palette: {
    mode: 'light',
    background: {
      default: '#f0f2f5',
    },
  },
  components: {
    MuiButton:{
      variants:[
        {
          props:{variant:'clearConversations'},
          style:{
            color:'black',
            borderColor:'black',
            '&:hover':{
              backgroundColor:'rgba(0,0,0,0.04)',
              borderColor:'black',
            }
          }
        },
        {
          props:{variant:'outlined'},
          style: {
            borderColor: 'black',
            color: 'black',
            '&:hover': {
              borderColor: 'black',
              backgroundColor: 'rgba(0,0,0,0.04)',
            }
          }
        }
      ]
    }
  }
};