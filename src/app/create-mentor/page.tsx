"use client"
import React, { useState } from 'react';
import axios from '../../../api/api';

interface FormData {
  name: string;
  subject: string[];
  bio: string;
  photo: string | '';
  linkedin: string;
  city: string;
  state: string;
  country: string;
}

export default function MyForm() {
  const [imageUrl, setImageUrl] = useState<string | ''>('');
  const [formData, setFormData] = useState<FormData>({
    name: 'José Torres',
    subject: ['Finanças Pessoais, Planejamento de Carreira, Voluntariado'],
    bio: 'Acredito que todos nós estamos no mundo para evoluir, e a cooperação para isso é essencial. Ninguém chega a lugar nenhum sozinho. Sou servidor público, trabalha na administração federal, sou graduado em Ciências Contábeis, e tenho especialização em Gestão Pública. Também trabalho com redes sociais, e tenho um certo conhecimento de comércio. Espero poder ajudar alguém.',
    photo: imageUrl || '',
    linkedin: 'http://lattes.cnpq.br/8808722229125981',
    city: 'Recife',
    state: 'PE',
    country: 'Brasil',
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
        setFormData((prevData) => ({
          ...prevData,
          photo: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await axios.post('/mentors', formData);
      console.log(formData);

      // Lide com a resposta da API aqui
      console.log(response.data);
    } catch (error) {
      // Lide com o erro aqui
      console.error(error);
    }
  };

  return (
    <div>
      <form onSubmit={handleFormSubmit} style={{ backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />

        <label htmlFor="photo">Photo:</label>
        <input type="file" id="photo" name="photo" onChange={handleFileChange} />

        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}
