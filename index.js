var chalk			 	= require('chalk'),
clear			 		= require('clear'),
figlet					= require('figlet'),
inquirer				= require('inquirer'),
fs						= require('fs'),
hostile					= require('hostile'),
mkdirp 					= require('mkdirp'),
jsonfile 				= require('jsonfile');

jsonfile.spaces = 4;

configFile = 'config.json';

clear();
console.log(
	chalk.red(
		figlet.textSync('New Website', {
			horizontalLayout: 'default',
			font: 'standard'
		})
	)
);


/**
 * Om filen inte finns så skapar vi den
 */
if(!fileExists(configFile)) {
	fs.writeFile(configFile, '', function(err) {
	    if(err) {
			return console.log(err);
	    }

	    console.log('Skapade config.json');
	});
}

/**
 * Starta processen
 */
doNewWebsite(configFile, function(config) {
	// console.log(config);
});



function folderExists(path){
	try {
		stats = fs.lstatSync(path);
		return stats.isDirectory();
	}
	catch (err) {
		return false;
	}
}

function fileExists(filePath){
	try
	{
		return fs.statSync(filePath).isFile();
	}
	catch (err)
	{
		return false;
	}
}


function doNewWebsite(configFile, callback) {
	jsonfile.readFile(configFile, function(err, obj) {

		if(!obj) {
			obj = {};
		}

		/**
		 * Kolla om det finns någon info i configfilen
		 */
		wf = 1;
		if(!obj.webserver_folder || obj.webserver_folder.length < 1) {
			wf = 0;
		}
		os = 1;
		if(!obj.OS || obj.OS.length < 1) {
			os = 0;		
		}

		questions(obj,wf,os,function(){

			/**
			 * Lägg till information i configfilen
			 */
			if(wf == 0) {
				obj.webserver_folder = arguments[0].webserver_folder;
			}
			if(os == 0) {
				obj.OS = arguments[0].OS;
			}
			jsonfile.writeFile(configFile, obj, function (err) {});

			/**
			 * Lägg in informationen i hosts-filen
			 */
			hostile.set('127.0.0.1', arguments[0].website_domain+'.nitea.net', function (err) {
				if (err) {
					console.error(err)
				}
			});

			dir = obj.webserver_folder+arguments[0].website_folder+"/"+arguments[0].website_domain+"/public_html";
			mkdirp(dir, function (err) {});

			vhostData = "\n<VirtualHost *:80>\n"+
"	ServerName "+arguments[0].website_domain+".nitea.net\n"+
"	ServerAdmin support@nitea.se\n"+
"	DocumentRoot "+obj.webserver_folder+arguments[0].website_folder+"/"+arguments[0].website_domain+"/public_html\n"+
"	<Directory "+obj.webserver_folder+arguments[0].website_folder+"/"+arguments[0].website_domain+"/public_html>\n"+
"		Options Indexes FollowSymLinks Includes execCGI\n"+
"		AllowOverride All\n"+
"		Require all granted\n"+
"	</Directory>\n"+
"</VirtualHost>\n";

			fs.appendFile('/Applications/XAMPP/xamppfiles/etc/extra/httpd-vhosts.conf', vhostData, function (err) {
				// console.log(err);
			});

			console.log('Klar!')
		});

		callback(obj);
	});

}


fs.mkdirParent = function(dirPath, mode, callback) {
  //Call the standard fs.mkdir
  fs.mkdir(dirPath, mode, function(error) {
    //When it fail in this way, do the custom steps
    if (error && error.errno === 34) {
      //Create all the parents recursively
      fs.mkdirParent(path.dirname(dirPath), mode, callback);
      //And then the directory
      fs.mkdirParent(dirPath, mode, callback);
    }
    //Manually run the callback since we used our own callback to do all these
    callback && callback(error);
  });
};

function questions(obj,wf,os,callback) {
	
	questionsJson = [];

	if(wf == 0) {
		questionsJson.push(
			{
				name: 'webserver_folder',
				type: 'input',
				message: 'Ange den absoluta sökvägen till mappen där du sparar dina webbplatser:',
				validate: function( value ) {
					if (value.length) {
						return true;
					} else {
						return 'Kunde inte förstå vad du menar...';
					}
				}
			}
		);
	}

	if(os == 0) {
		questionsJson.push(
			{
				name: 'OS',
				type: 'list',
				message: 'Vilket operativsystem använder du?:',
				choices: ['Windows', 'Unix'],
				validate: function( value ) {
					if (value.length) {
						return true;
					} else {
						return 'Kunde inte förstå vad du menar...';
					}
				}
			}
		);
	}

	questionsJson.push(
		{
			name: 'website_folder',
			type: 'input',
			message: 'Företagets namn:',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Kunde inte förstå vad du menar...';
				}
			}
		},
		{
			name: 'website_domain',
			type: 'input',
			message: 'Domännamn:',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Kunde inte förstå vad du menar...';
				}
			}
		}
	);

	inquirer.prompt(questionsJson).then(callback);
}