import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DollarSignIcon, CreditCardIcon, QrCodeIcon, BanknoteIcon } from 'lucide-react'
import Image from 'next/image'

export default function DonatePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <section className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-gray-50 mb-6 leading-tight">
          Apoie o Mentor Connect
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Sua contribuição nos ajuda a manter a plataforma funcionando e a expandir nosso impacto, conectando mais pessoas a oportunidades de mentoria.
        </p>
      </section>

      <Card className="mb-12">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Faça uma Doação</CardTitle>
          <CardDescription>Escolha a forma como você gostaria de contribuir.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pix Donation */}
            <Card className="p-6 flex flex-col items-center text-center">
              <QrCodeIcon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Doação via Pix</h3>
              <p className="text-muted-foreground mb-4">
                A forma mais rápida e fácil de doar no Brasil.
              </p>
              <div className="w-full max-w-[200px] mb-4">
                <Image
                  src="/qr-code-pix-example.png"
                  alt="QR Code Pix"
                  width={200}
                  height={200}
                  className="rounded-md"
                />
              </div>
              <p className="font-semibold text-lg mb-2">Chave Pix:</p>
              <p className="text-primary-foreground bg-primary px-4 py-2 rounded-md mb-4">
                mentorconnect@email.com
              </p>
              <Button variant="outline" className="w-full">
                Copiar Chave Pix
              </Button>
            </Card>

            {/* Credit Card Donation */}
            <Card className="p-6 flex flex-col items-center text-center">
              <CreditCardIcon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Doação com Cartão de Crédito</h3>
              <p className="text-muted-foreground mb-4">
                Contribua de forma segura com seu cartão.
              </p>
              <form className="w-full space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Valor da Doação (R$)</Label>
                  <Input id="amount" type="number" placeholder="50.00" min="1" step="0.01" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-number">Número do Cartão</Label>
                  <Input id="card-number" type="text" placeholder="**** **** **** ****" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expiry-date">Validade</Label>
                    <Input id="expiry-date" type="text" placeholder="MM/AA" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" type="text" placeholder="123" />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <DollarSignIcon className="mr-2 h-4 w-4" />
                  Doar Agora
                </Button>
              </form>
            </Card>
          </div>

          <Separator />

          {/* Bank Transfer */}
          <section className="text-center">
            <h2 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
              <BanknoteIcon className="h-6 w-6 text-primary" />
              Transferência Bancária
            </h2>
            <p className="text-muted-foreground mb-4">
              Se preferir, você pode fazer uma transferência diretamente para nossa conta.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-md mx-auto">
              <div>
                <p className="font-medium">Banco:</p>
                <p>Banco do Brasil</p>
              </div>
              <div>
                <p className="font-medium">Agência:</p>
                <p>0000</p>
              </div>
              <div>
                <p className="font-medium">Conta Corrente:</p>
                <p>123456-7</p>
              </div>
              <div>
                <p className="font-medium">CNPJ:</p>
                <p>XX.XXX.XXX/XXXX-XX</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium">Nome da Instituição:</p>
                <p>Associação Mentor Connect</p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      <section className="text-center text-muted-foreground text-sm">
        <p>
          Todas as doações são processadas de forma segura. O Mentor Connect é uma organização sem fins lucrativos e sua doação é dedutível de impostos (onde aplicável).
        </p>
        <p className="mt-2">
          Para mais informações sobre como sua doação é utilizada, entre em contato conosco.
        </p>
      </section>
    </div>
  )
}
