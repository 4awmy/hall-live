# Hall Live at the venue

## Quick setup

1. **Power the router.** Use its normal router mode with DHCP enabled and leave the internet/WAN port unplugged. Create or use an event Wi-Fi network with a password. Avoid a guest network that blocks access to the host computer. If the venue manages the router, ask its operator for a network that permits phones to reach the host.
2. **Connect the Windows host.** Use a router LAN port by Ethernet if convenient, or join the same Wi-Fi as the audience. Plug the host into power. Run `ipconfig` and copy the IPv4 address of the connected adapter. If the router supports DHCP reservations, reserve that address for the host before printing anything.
3. **Start Hall Live.** Open PowerShell in this folder. Replace the two example passwords with distinct rehearsal passwords and run:

   ```powershell
   $env:HALL_OMAR = 'replace-with-omar-password'
   $env:HALL_EZZAT = 'replace-with-ezzat-password'
   $env:HALL_BIND = '0.0.0.0'
   $env:HALL_PORT = '8080'
   node server.mjs
   ```

   Keep this terminal open. On the host, open `http://127.0.0.1:8080/?view=projector` for the projector or `http://127.0.0.1:8080/?view=studio` for presenter controls. Keep presenter sign-ins on the host or a trusted presenter network. Attendees use the host IPv4 address, for example `http://192.168.1.42:8080/`.
4. **Test on a phone before printing.** Join the event Wi-Fi and stay connected if it says there is no internet. Temporarily turn off mobile data during the rehearsal. Type the full host address beginning with `http://`. Cue **You Are the LLM**, open voting, submit one test vote, close it, and reveal it on the projector.
5. **Make the sign.** On the host, open `http://127.0.0.1:8080/join`. Enter the Wi-Fi name and the exact address that worked on the phone. Choose **Make QR**, then scan it on that phone. Choose **Print card** to print or save a PDF. Post the Wi-Fi password at the door separately if attendees need it. If the host address changes, regenerate the QR.

## If the phone can’t connect

- Check that the phone is on the hall Wi-Fi, the server is still running, and the address includes the correct port and `http://`.
- Check guest network restrictions or client isolation with the router operator. If firewall policy is blocking the connection, have the host administrator permit the Hall Live server on the event network only. Keep the firewall enabled and leave router port forwarding off.
- If connectivity drops during the talk, close the ballot or stop calling for digital votes. Use a show of hands and a tally sheet. Keep a local slide copy and stopwatch available for the projector and debate.

[Windows Firewall guidance](https://support.microsoft.com/en-us/windows/security/windows-security/firewall-and-network-protection-in-the-windows-security-app) · [Example router guide for DHCP reservations](https://www.tp-link.com/us/user-guides/TL-WR940N_V6/chapter-5-configure-the-router-in-access-point-mode) · [How client isolation can block local connections](https://www.tp-link.com/us/support/faq/2089/)
