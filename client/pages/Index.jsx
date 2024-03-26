import { Form, FormLayout, TextField, Button, Text } from "@shopify/polaris";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import "./index.css";

const HomePage = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [shopUrl, setShopUrl] = useState('')

  const navigate = useNavigate();

  const fetchData = async () => {
    const res = await fetch(`/api/apps/login/credentials?email=${email}&password=${password}?shop=${shopUrl}&apikey=${apiKey}`);
    console.log('response: => ', res);
    const result = await res.json();
    if (res.ok) {
      console.log('login succesfull', result)
      // navigate('https://dashboard.openleaf.tech/auth/login')
      setErrorMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
  }

  const submitForm = (event) => {
    event.preventDefault();
    console.log('result and window.shopify', result, window?.shopify);
    fetchData();

  }

  useEffect(() => {
    if (window?.shopify?.config) {
      setApiKey(window?.shopify?.config?.apiKey)
      setS
      console.log('window.shopify => ', window?.shopify)
    }
  }, [window])

  return (
    <>
<div className="login-container">
      <img src="/openleaf.svg" alt="Your Company Logo" className="logo" />
      <Text variant="heading3xl" as="h2">
        Login
      </Text>
      <Form className="login-form">
        <FormLayout>
          <TextField
            label="Email"
            // placeholder="email"
            value={email}
            onChange={(event) => {
              console.log('event => ', event);
              setEmail(event.target.value)
            }}
            type="email"
            autoComplete="off"
          />
          <TextField
            label="Password"
            value={password}
            onChange={(event) => {
              console.log(event);
              setPassword(event.target.value)
            }}
            type="password"
            autoComplete="off"
          />

          <h1>Temp Testing</h1>
          <input type="text" value={email} onChange={(event) => {
            setEmail(event.target.value)
            console.log(email)
          }} />
          <input type="text" value={email} onChange={(event) => {
            setEmail(event.target.value)
            console.log(email)
          }} />
          <button onClick={submitForm}>Login</button>

          <br></br>

          {errorMessage && <FormLayout content={errorMessage} error />}
          <div>
            <h3>
              New here? {" "}
              <a href="https://dashboard.openleaf.tech/auth/register">
                Create Account
              </a>
            </h3>
          </div>
          <FormLayout>
            <Button type="submit" primary onClick={submitForm}>
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