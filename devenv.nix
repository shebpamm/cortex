{ pkgs, lib, config, inputs, ... }:

{
  packages = with pkgs; [];
  env.NEXT_PUBLIC_APP_MODE = "dev";
}
