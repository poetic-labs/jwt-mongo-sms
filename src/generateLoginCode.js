const generateLoginCode = loginCodeLength => (
  [...Array(loginCodeLength)].reduce((code) => {
    const nextDigit = String(Math.floor(Math.random() * 10));

    return code + nextDigit;
  }, '')
);

export default generateLoginCode;
