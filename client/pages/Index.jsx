import { Form, FormLayout, TextField, Button } from "@shopify/polaris";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";

const HomePage = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [show, setShow] = useState(false)
  const handleClick = () => setShow(!show)

  const navigate = useNavigate();

  const submitForm = async (event) => {
    event.preventDefault();
    console.log('result and window.shopify', result, window?.shopify);
    const res = await fetch(`/api/apps/login/credentials?email=${email}&password=${password}?shop=${window?.shopify?.config?.shop}`);
    const result = await res.json();
    if (res.ok) {
      console.log('login succesfull')
      // navigate('https://dashboard.openleaf.tech/auth/login')
      setErrorMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
  }

  useEffect(() => {
    if (window?.shopify) {
      console.log('window.shopify => ', window?.shopify)
    }
  }, [window])

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

    <div className="login-container">
      <img src="../public/openleaf.svg" alt="Openleaf" className="logo" />
      <Form onSubmit={handleSubmit}>
        <FormLayout>
          <TextField
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="off"
          />
          <TextField
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="off"
          />
          {errorMessage && <FormLayout content={errorMessage} error />}
          <div><h3>New here <a href="https://dashboard.openleaf.tech/auth/register">Create Account</a></h3>
          </div>
          <FormLayout>
            <Button type="submit" onClick={submitForm} primary>
              Log in
            </Button>
          </FormLayout>
        </FormLayout>
      </Form>
    </div>

    </>
  );
};

export default HomePage;
