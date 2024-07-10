{ pkgs, lib, config, inputs, ... }:

{
  packages = with pkgs; [ openssl.dev pkg-config ];
}
