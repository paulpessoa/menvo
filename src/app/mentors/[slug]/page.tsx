import React, { Suspense } from "react";
import Image from "next/image";
import "./style.scss";
import { Button, Link, Tag, Text, HStack, Card, Flex, Box, Heading, CircularProgress, ButtonGroup } from '@chakra-ui/react';
import api from "api";
import { Mentor } from "types";

async function getMentor(slug: string) {
  const res = await api.get(`/mentors?slug=eq.${slug}`)
  return res.data[0]
}

export default async function MentorPage({ params: { slug } }: { readonly params: { readonly slug: string } }) {
  const mentor: Mentor = await getMentor(slug)
  const { name, description, photo, bio, linkedin, subject, calendar } = mentor
  return (
    <div className="Mentors">
      <div className="container">

        <Box maxW="7xl" mx="auto" px={4}> {/* Set max width and margin for responsiveness */}
          <Suspense fallback={<CircularProgress isIndeterminate color='green.300' />}>
            <Flex direction="column" alignItems="center"> {/* Center content vertically */}
              <Image
                className="mentor-photo"
                height={200}
                width={200}
                src={photo || "/images/no-image.jpg"}
                alt={name}
                style={{ borderRadius: '50%' }}
              />
              <Heading as="h2" mt={4} mb={2} fontSize="2xl" textAlign="center">
                {name}
              </Heading>
              <Text mb={4}>{description}</Text>
              <Text>{bio}</Text>

              <Heading as="h2" mt={4} mb={2}>
                Temas
              </Heading>
              <Card variant="subtle"> {/* Subtle variant for lighter background */}
                <HStack spacing={4}>
                  {subject.map((item: any) => (
                    <Tag size="sm" key={item} borderRadius="full" variant="solid" colorScheme="green">
                      {item}
                    </Tag>
                  ))}
                </HStack>
              </Card>
              <ButtonGroup gap='2'>

                <Button mt={4} variant="outline" colorScheme="linkedin" leftIcon={<i className="fab fa-linkedin"></i>}>
                  <Link href={linkedin} target="_blank" rel="noreferrer noopener">
                    Veja o perfil no LinkedIn
                  </Link>
                </Button>
                <Button mt={4} colorScheme="teal" leftIcon={<i className="fab fa-linkedin"></i>}>
                  <Link href={calendar} target="_blank" rel="noreferrer noopener">
                    Agendar conversa no Calendly
                  </Link>
                </Button>
              </ButtonGroup>
            </Flex>
          </Suspense>
        </Box>
      </div>
    </div>


  );
}

