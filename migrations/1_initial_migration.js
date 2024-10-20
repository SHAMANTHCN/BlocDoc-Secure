const DocumentVerification = artifacts.require("DocumentVerification");

module.exports = function(deployer) {
  deployer.deploy(DocumentVerification);
};
