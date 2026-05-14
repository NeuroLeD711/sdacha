import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App'
import store from './store'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0b5fff' },
    secondary: { main: '#ff8a00' },
    background: {
      default: '#f4f8ff',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 }
  },
  shape: {
    borderRadius: 14
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
          backgroundImage: 'radial-gradient(circle at 20% -10%, rgba(11, 95, 255, 0.12), transparent 50%), radial-gradient(circle at 80% 120%, rgba(255, 138, 0, 0.12), transparent 45%)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700
        }
      }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
)
