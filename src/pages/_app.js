import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ConfigProvider, Layout, Menu, theme } from 'antd';
import Link from "next/link";
import "@/styles/globals.css";
import themeConfig from '@/components/theme/themeConfig';


const { Header, Content, Footer } = Layout;

export default function App({ Component, pageProps }) {
  const [selectedKeys, setSelectedKeys] = useState(['home']);
  const router = useRouter();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  useEffect(() => {
    if (router?.pathname.endsWith('services')) {
      setSelectedKeys(['services']);
    } else if (router?.pathname.endsWith('about-us')) {
      setSelectedKeys(['about-us']);
    } else {
      setSelectedKeys(['home']);
    }
  }, [router?.pathname]);
  return (
    <ConfigProvider theme={themeConfig}>
      <Layout>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div className="demo-logo" />
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={selectedKeys}
            items={[
              {
                label: <Link href={'/'} >Home</Link>,
                key: 'home'
              },
              {
                label: <Link href={'/services'} >Services</Link>,
                key: 'services'
              }
            ]}
            style={{
              flex: 1,
              minWidth: 0,
            }}
            onClick={({ key }) => {

              setSelectedKeys([key]);
              router.push(`/${key === 'home' ? '' : key}`)
            }}
          />
        </Header>
        <Content
          style={{
            padding: '20px 48px 0',
          }}
        >
          <div
            style={{
              padding: 24,
              minHeight: 380,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Component {...pageProps} />
          </div>
        </Content>
        <Footer
          style={{
            textAlign: 'center',
          }}
        >
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}
