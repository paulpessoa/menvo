"use client"
import { supabase } from 'lib/supabase';
import { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIcon from '@mui/icons-material/Phone';

const LoginPage = () => {
    const [email, setEmail] = useState('');

    const handleLogin = async (provider) => {
        let { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
        });
        if (error) console.error(error.message);
    };

    const handleEmailLogin = async () => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) console.error(error.message);
    };

    return (

        <Box
            sx={{
                flex: 1,
                backgroundImage: 'url("/images/menvopeople.jpg")', // Substitua pelo caminho da imagem
                height: '100vh',
                width: '100%',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    margin: '50px auto',
                    width: '40%',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'white',
                }}
            >
                <Typography variant="h4" sx={{ mb: 3 }}>
                    Criar uma conta
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<GoogleIcon />}
                    onClick={() => handleLogin('google')}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    Continuar com Google
                </Button>

                <Button
                    variant="contained"
                    startIcon={<PhoneIcon />}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    Continuar com Telefone
                </Button>

                <TextField
                    variant="outlined"
                    label="Email"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <Button
                    variant="contained"
                    startIcon={<MailOutlineIcon />}
                    fullWidth
                    onClick={handleEmailLogin}
                >
                    Continuar com Email
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption">
                        Ao continuar, você concorda com os Termos de Uso e Política de Privacidade.
                    </Typography>
                </Box>
            </Box>

        </Box>

    );
};

export default LoginPage;
