const generateAuthCode = authCodeLength => (
  [...Array(authCodeLength)].reduce((code) => {
    const nextDigit = String(Math.floor(Math.random() * 10));

    return code + nextDigit;
  }, '')
);

export default generateAuthCode;
