import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { GraduationCap, Users, Building2, Briefcase } from 'lucide-react'
import { UserType } from '@/hooks/useSignupForm'

interface UserTypeSelectorProps {
  userType: UserType
  setUserType: (type: UserType) => void
}
export function UserTypeSelector({ userType, setUserType }: UserTypeSelectorProps) {
  const { t } = useTranslation()

  const userTypes = [
    { id: 'mentee' as UserType, icon: GraduationCap, title: t('register.userType.mentee.title'), description: t('register.userType.mentee.description') },
    { id: 'mentor' as UserType, icon: Users, title: t('register.userType.mentor.title'), description: t('register.userType.mentor.description') },
    { id: 'company' as UserType, icon: Building2, title: t('register.userType.company.title'), description: t('register.userType.company.description') },
    { id: 'recruiter' as UserType, icon: Briefcase, title: t('register.userType.recruiter.title'), description: t('register.userType.recruiter.description') },
  ]

  const handleTypeChange = (value: string) => {
    console.log('Valor selecionado:', value)
    setUserType(value as UserType)
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">
        {t('register.userType.title') || 'Tipo de usuário'}
      </Label>
      <RadioGroup 
        value={userType} 
        onValueChange={handleTypeChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
        // className="space-y-3"
      >
        {userTypes.map((type) => (
          <div key={type.id} className="relative">
            <label htmlFor={type.id} className="cursor-pointer">
              <Card 
                className={`p-3 transition-all hover:border-primary ${
                  userType === type.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <RadioGroupItem 
                      value={type.id} 
                      id={type.id}
                      className="mt-0.5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <type.icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium text-sm leading-tight">
                        {type.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>
              </Card>
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
