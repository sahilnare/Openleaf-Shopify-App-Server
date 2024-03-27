import { Form, FormLayout, TextField, Button, Text } from "@shopify/polaris";
import { useNavigate } from "raviger";
import { useEffect, useState, useCallback } from "react";
import "./index.css";

const HomePage = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [shopUrl, setShopUrl] = useState(null)
  const [isUserLogin, setIsUserLogin] = useState(false)
  const [loader, setLoader] = useState(true)

  const navigate = useNavigate();

  const checkLogin = async (shop_url) => {
    const res = await fetch(`/api/apps/islogin?shop=${shop_url}`);
    console.log('response login => ', res);
    const result = await res.json();
    if (res.ok) {
      console.log('user already present');
      setErrorMessage(result.message);
      setIsUserLogin(true);
    } else {
      setErrorMessage(result.message);
    }
    setLoader(false);
  }

  const fetchData = async () => {
    setLoader(true)
    const res = await fetch(`/api/apps/login/credentials?email=${email}&password=${password}&shop=${shopUrl}&apikey=${apiKey}`);
    console.log('response: => ', res);
    const result = await res.json();
    if (res.ok) {
      console.log('login succesfull', result)
      setIsUserLogin(true)
      // navigate('https://dashboard.openleaf.tech/auth/login')
      setErrorMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
    setLoader(false);
  }

  const submitForm = (event) => {
    // event.preventDefault();
    console.log('result and window.shopify', window?.shopify);
    try {
      fetchData();
    } catch (error) {
      console.log('error in submit from => ', error);
    }

  }

  const handleEmail = useCallback(
    (newValue) => setEmail(newValue),
    [],
  );

  const handlePassword = useCallback(
    (newValue) => setPassword(newValue),
    [],
  )

  useEffect(() => {
    if (window?.shopify?.config) {
      setApiKey(window?.shopify?.config?.apiKey)
      setShopUrl(window?.shopify?.config?.shop)
      console.log('window.shopify => ', window?.shopify)
    }
  }, [window])

  useEffect(() => {
    if (shopUrl) {
      checkLogin(shopUrl)
    }
  }, [shopUrl])

  if (isUserLogin) {
    return (
      <Text variant="heading3xl" alignment="center" tone="success">Already Register to Openleaf</Text>
    )
  }

  return (
    <>
<div className="login-container">
      <img src="/openleaf.svg" alt="Your Company Logo" className="logo" />
      <Text variant="heading3xl" as="h2">
        { loader ? 'Loading' : "Login"}
      </Text>
      <br></br>
      <br></br>
      <Form className="login-form">
        <FormLayout>
          <TextField
            label="Email"
            // placeholder="email"
            value={email}
            onChange={handleEmail}
            type="email"
            autoComplete="off"
          />
          <TextField
            label="Password"
            value={password}
            onChange={handlePassword}
            type="password"
            autoComplete="off"
          />

          {errorMessage && <FormLayout content={errorMessage} error />}
          {errorMessage && <h1>{errorMessage}</h1>}
          <div>
            <h3>
              New here? {" "}
              <a href="https://dashboard.openleaf.tech/auth/register">
                Create Account
              </a>
            </h3>
          </div>
          <FormLayout>
            <Button primary onClick={submitForm}>
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