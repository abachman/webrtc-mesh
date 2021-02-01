module.exports = async function () {
  await global.__FAYE__.close()
}
