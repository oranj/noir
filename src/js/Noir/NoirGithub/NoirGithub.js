module.exports = class NoirGithub {

	constructor( config ) {
		this.avatarTemplate = config.avatarTemplate;
		this.usernameMap = config.usernameMap;
	}

	getAvatarFromSender( sender ) {
		if ( !this.usernameMap.hasOwnProperty( sender ) ) {
			return null;
		}
		return this.avatarTemplate.replace( "${username}", this.usernameMap[ sender ] );
	}
};

