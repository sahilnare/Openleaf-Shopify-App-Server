import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  Stack,
  Text,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'

import { ExternalIcon } from "@shopify/polaris-icons";
import { navigate, useNavigate } from "raviger";
import { useEffect, useState } from "react";

const HomePage = () => {

  const [shop, setShop] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [show, setShow] = useState(false)
  const handleClick = () => setShow(!show)

  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData(formData => {
      return {
        ...formData,
        [event.target.name]: event.target.value
      }
    })
  }

  const submitForm = (event) => {
    event.preventDefault();
    navigate('/api/apps/login/credentials')
  }
  useEffect(() => {
    if (window?.shopify) {
      console.log('window.shopify => ', window?.shopify)
    }
  }, [])

  return (
    <>
      {/* <Page title="Home">
        <Layout>
          <Layout.Section variant="fullWidth">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Debug Cards
                </Text>
                <Text>
                  Explore how the repository handles data fetching from the
                  backend, App Proxy, making GraphQL requests, Billing API and
                  more.
                </Text>
                <InlineStack wrap={false} align="end">
                  <Button
                    variant="primary"
                    onClick={() => {
                      navigate("/debug");
                    }}
                  >
                    Debug Cards
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  App Bridge CDN
                </Text>
                <Text>
                  App Bridge has changed. Read more about it in the docs
                </Text>
                <InlineStack wrap={false} align="end">
                  <Button
                    variant="primary"
                    external
                    icon={ExternalIcon}
                    onClick={() => {
                      open(
                        "https://shopify.dev/docs/api/app-bridge-library/reference",
                        "_blank"
                      );
                    }}
                  >
                    Explore
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Repository
                </Text>
                <Text>
                  Found a bug? Open an issue on the repository, or star on
                  GitHub
                </Text>
                <InlineStack wrap={false} align="end" gap="200">
                  <Button
                    external
                    icon={ExternalIcon}
                    onClick={() => {
                      open(
                        "https://github.com/kinngh/shopify-node-express-mongodb-app/issues?q=is%3Aissue",
                        "_blank"
                      );
                    }}
                  >
                    Issues
                  </Button>
                  <Button
                    external
                    variant="primary"
                    icon={ExternalIcon}
                    onClick={() => {
                      open(
                        "https://github.com/kinngh/shopify-node-express-mongodb-app",
                        "_blank"
                      );
                    }}
                  >
                    Star
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Course
                </Text>
                <Text>
                  [BETA] I'm building course as a live service on How To Build
                  Shopify Apps
                </Text>
                <InlineStack wrap={false} align="end">
                  <Button
                    external
                    variant="primary"
                    icon={ExternalIcon}
                    onClick={() => {
                      open(
                        "https://kinngh.gumroad.com/l/how-to-make-shopify-apps?utm_source=boilerplate&utm_medium=expressjs",
                        "_blank"
                      );
                    }}
                  >
                    Buy
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneHalf" />
        </Layout>
      </Page> */}
	  {/* <Page title="Openleaf">
        <Layout>
          <Layout.Section variant="fullWidth">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Login to Openleaf
                </Text>
                <Text>
                  Login using this link and enter your Openleaf credentials
                </Text>
				<InlineStack wrap={false} align="end">
                  <Button
                    variant="primary"
                    external
                    icon={ExternalIcon}
                    onClick={() => {
                      open(
                        "https://dashboard.openleaf.tech/admin/dashboard",
                        "_blank"
                      );
                    }}
                  >
                    Login
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          
        </Layout>
      </Page> */}


<Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
    <Stack spacing="8">
      <Stack spacing="6">
        <Text align='center'>Logo</Text>
        <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
          <Heading size={{ base: 'xs', md: 'sm' }}>Log in to your account</Heading>
        </Stack>
      </Stack>
      <Box
        py={{ base: '0', sm: '8' }}
        px={{ base: '4', sm: '10' }}
        bg={{ base: 'transparent', sm: 'bg.surface' }}
        boxShadow={{ base: 'none', sm: 'md' }}
        borderRadius={{ base: 'none', sm: 'xl' }}
      >
        <Stack spacing="6">
          <Stack spacing="5">
            <FormControl action="/api">
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input id="email" name="email" type="email" onChange={handleChange} />
                  <InputGroup size='md' mt='6'>
                    <Input
                      pr='4.5rem'
                      type={show ? 'text' : 'password'}
                      placeholder='Enter password'
                      name='password'
                      onChange={handleChange}
                    />
                    <InputRightElement width='4.5rem'>
                      <Button h='1.75rem' size='sm' onClick={handleClick}>
                        {show ? 'Hide' : 'Show'}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
            </FormControl>
          </Stack>
          <Stack spacing="6">
            <Button onClick={submitForm}>Sign in</Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
</Container>  
    </>
  );
};

export default HomePage;
