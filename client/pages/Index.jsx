import { Form, FormLayout, TextField, Button, Text, Card, Spinner } from "@shopify/polaris";
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

  const checkLogin = async (shop_url) => {
    setLoader(true)
    try {
      const res = await fetch(`/api/apps/islogin?shop=${shop_url}`);
      const result = await res.json();
      if (res.ok) {
        setErrorMessage(result.message);
        setIsUserLogin(true);
      }
    } catch (error) {
      console.log(error);
    }
    setLoader(false);
  }

  const fetchData = async () => {
    setLoader(true)
    const res = await fetch(`/api/apps/login/credentials?email=${email}&password=${password}&shop=${shopUrl}&apikey=${apiKey}`);
    const result = await res.json();
    if (res.ok) {
      setIsUserLogin(true)
      setErrorMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
    setLoader(false);
  }
  
  const syncOrders = async () => {  
    setLoader(true)
    try {

      const res = await fetch(`/api/apps/syncOrders?shop=${shopUrl}`);
      const result = await res.json();
      if (res.ok) {
        setErrorMessage(result.message);
      } else {
        setErrorMessage(result.message);
      }
      
    } catch (error) {
      console.log(error);
    }
    setLoader(false);
  }

  const submitSync = () => {
    syncOrders();
  }

  const submitForm = (event) => {
    // event.preventDefault();
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
    }
  }, [window])

  useEffect(() => {
    if (shopUrl) {
      checkLogin(shopUrl)
    }
  }, [shopUrl])

  if (isUserLogin) {
    return (
      <div className="card-sync">
        <Text variant="heading2xl" alignment="center" tone="base" margin="30px 10px">Registered Successfully on Openleaf</Text>
        <Card className='card-sync-main'>
          <Text as="h2" variant="headingMd">
            Synchronize all your orders with Openleaf.
          </Text>
          <div className='card-sync-btn'>
            <Button primary onClick={submitSync}>Sync</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
<div className="login-container">
      <img src="/openleaf.svg" alt="Openleaf Logo" className="logo" />
      <Text variant="heading3xl" as="h2">
        Login
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
              <a href="https://dashboard.openleaf.tech/auth/register" target="_blank">
                Create Account
              </a>
            </h3>
          </div>
          <FormLayout>
            <Button primary onClick={submitForm}>
              {loader ? <Spinner accessibilityLabel="Spinner example" size="small" /> : 'Log In'}
            </Button>
          </FormLayout>
        </FormLayout>
      </Form>
    </div>

    </>
  );
};

export default HomePage;