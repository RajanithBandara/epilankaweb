// filepath: src/pages/_error.tsx
import { NextPage } from 'next';

interface ErrorProps {
  statusCode?: number;
}

const ErrorPage: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div style={{ padding: 32 }}>
      <h1>{statusCode ? `An error ${statusCode} occurred` : 'An error occurred'}</h1>
      <p>Please try again later.</p>
    </div>
  );
};

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res?.statusCode || err?.statusCode || 500;
  return { statusCode };
};

export default ErrorPage;

