module.exports = function(grunt) {

	grunt.initConfig({
		compass: {
			dist: {
				options: {
					sassDir: "./scss",
					cssDir: "./src/css"
				}
			}
		},
		watch: {
			compass: {
				files: [ './scss/**/*.scss' ],
				tasks: [ 'compass:dist' ]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['jshint']);

};