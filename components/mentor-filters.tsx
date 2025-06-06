"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function MentorFilters() {
  const [expanded, setExpanded] = useState<string[]>(["topics", "languages", "inclusion"])

  return (
    <div className="bg-card border rounded-lg p-4 space-y-6 sticky top-20">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filters</h3>
        <Button variant="ghost" size="sm" className="h-8 text-sm">
          Reset
        </Button>
      </div>

      <Separator />

      <Accordion type="multiple" value={expanded} onValueChange={setExpanded} className="space-y-2">
        <AccordionItem value="topics" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline">
            <span className="text-sm font-medium">Topics</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              {["Career", "Academia", "Tech", "Business", "Leadership", "Personal Development"].map((topic) => (
                <div key={topic} className="flex items-center space-x-2">
                  <Checkbox id={`topic-${topic}`} />
                  <Label htmlFor={`topic-${topic}`} className="text-sm font-normal cursor-pointer">
                    {topic}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline">
            <span className="text-sm font-medium">Location</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm">
                  Country
                </Label>
                <Input id="country" placeholder="Any country" className="h-8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm">
                  City
                </Label>
                <Input id="city" placeholder="Any city" className="h-8" />
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox id="remote-only" />
                <Label htmlFor="remote-only" className="text-sm font-normal cursor-pointer">
                  Remote only
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="languages" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline">
            <span className="text-sm font-medium">Languages</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              {["English", "Spanish", "Portuguese", "French", "German"].map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox id={`lang-${language}`} />
                  <Label htmlFor={`lang-${language}`} className="text-sm font-normal cursor-pointer">
                    {language}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="inclusion" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline">
            <span className="text-sm font-medium">Inclusion Tags</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              {["Women", "LGBTQIA+", "50+", "Neurodivergent", "Black", "Indigenous", "People of Color"].map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox id={`tag-${tag}`} />
                  <Label htmlFor={`tag-${tag}`} className="text-sm font-normal cursor-pointer">
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline">
            <span className="text-sm font-medium">Experience</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              {["1+ years", "3+ years", "5+ years", "10+ years"].map((exp) => (
                <div key={exp} className="flex items-center space-x-2">
                  <Checkbox id={`exp-${exp}`} />
                  <Label htmlFor={`exp-${exp}`} className="text-sm font-normal cursor-pointer">
                    {exp}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="rating" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline">
            <span className="text-sm font-medium">Rating</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              {["4+ stars", "3+ stars", "2+ stars"].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox id={`rating-${rating}`} />
                  <Label htmlFor={`rating-${rating}`} className="text-sm font-normal cursor-pointer">
                    {rating}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <Button className="w-full">Apply Filters</Button>
    </div>
  )
}
