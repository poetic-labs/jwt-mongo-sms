const generateAuthCode = authCodeLength => (
  [...Array(authCodeLength)].reduce((authCode) => {
    const nextDigit = String(Math.floor(Math.random() * 10));

    return authCode + nextDigit;
  }, '')
);

export default generateAuthCode;
