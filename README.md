# Zimbra addon 
 
This zimlet provides the following functionality: 
- report a spam to our reporting system (spamreport.spamrl.com) 
- automatically log in to our web interface and display Control Panel interface to a Zimbra tab 

You may report any email as spam to our system by right-clicking it and selecting "Report Spam". If this is successful, the message "Email was reported as spam" will be shown. 
 
In order to access the web interface, config_template.xml should contain an admin's credentials. This admin should own your domain in our spam filtering system.
If your zimbra is configured over SSL, then your web interface URL should also use the HTTPS protocol. This is available for 'Logout URL' in your web interface configuration.

For custom branding, replace "zimletName" and "label" in com_zimbra_spamexperts.properties files. Default values are "SpamExperts".
For a custom icon, just replace zimlet_icon.gif with your own. Ensure that it is a .gif file with dimensions 16x16 px.

After all configuration is set up, you need to pack the addon (create a .zip archive with all sources named com_zimbra_spamexperts.zip) and install it.

Install the addon from the command line:
- upload com_zimbra_spamexperts.zip to `/opt/zimbra/zimlets/` directory 
- deploy the package using the command `/opt/zimbra/bin/zmzimletctl deploy /opt/zimbra/zimlets/com_zimbra_spamexperts.zip`
 
You should see as response:
 
```
- INFO: Deploying Zimlet com_zimbra_spamexperts in LDAP. 
- INFO: Installing Zimlet com_zimbra_spamexperts on this host. 
- INFO: Upgrading Zimlet com_zimbra_spamexperts to 1.0 
- INFO: Installing Zimlet config for com_zimbra_spamexperts 
- INFO: Adding Zimlet com_zimbra_spamexperts to COS default 
- INFO: Enabling Zimlet com_zimbra_spamexperts 
``` 

Log in as a user in Zimbra and check for the zimlet in Zimlet section. 
 
Due to Zimbra Cache is possible to not see the zimlet immediately.
 
Install the addon from Zimbra Admin Area:
- log in to your zimbra as administrator (using port 7071)
- go to Configure->Zimlets and deploy the zimlet
- check "Flush zimlet cache" to be sure you will see the zimlet immediately

By default, the zimlet is available to all users; from Zimbra administration, for each user, you can set if 
that user should have access to this zimlet or not.

By default, zimbra debug mode for zimlets is enabled and all the information can be found in /opt/zimbra/log/mailbox.log
If for some reason, debug mode was disabled, it can be enabled for an admin user, after executing the following:

```
su - zimbra
zmprov addAccountLogger <your admin user email address> zimbra.zimlet debug
```
