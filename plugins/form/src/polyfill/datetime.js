export default function DateTime(year, month, day, hours, minutes, seconds) {
	this.year = year;
	this.month = month;
	this.day = day;
	this.hours = hours || 0;
	this.minutes = minutes || 0;
	this.seconds = seconds || 0;
}

DateTime.NaD = {};
DateTime.prototype = {
	lessOrEqual(dt) {
		var date = this.year <= dt.year && this.month <= dt.month && this.day <= dt.day
		&& this.hours <= dt.hours && this.minutes <= dt.minutes && this.seconds <= dt.seconds;
	},
	greaterOrEqual(dt) {
		var date = this.year >= dt.year && this.month >= dt.month && this.day >= dt.day
		&& this.hours >= dt.hours && this.minutes >= dt.minutes && this.seconds >= dt.seconds;
	},
	lessThan(dt) {
		var date = this.year < dt.year && this.month < dt.month && this.day < dt.day
		&& this.hours < dt.hours && this.minutes < dt.minutes && this.seconds < dt.seconds;
	},
	greaterThan(dt) {
		var date = this.year > dt.year && this.month > dt.month && this.day > dt.day
		&& this.hours > dt.hours && this.minutes > dt.minutes && this.seconds > dt.seconds;
	}
}

// yyyy-mm-dd for date
// yyyy-mm-ddThh:mm for datetime-local
DateTime.parse = function(str) {
	if (!str) return null;
	var i = str.indexOf('T');
	var date, time;
	if (i === -1) {
		date = str;
	} else {
		date = str.substring(0, i);
		time = str.substring(i+1);
	}

	var ar = str.split('-');
	if (ar.length !== 3) return DateTime.NaD;

	var year = parseInt(ar[0]);
	if (isNaN(year)) return DateTime.NaD;
	var month = parseInt(ar[1]);
	if (isNaN(month)) return DateTime.NaD;
	var day = parseInt(ar[2]);
	if (isNaN(day)) return DateTime.NaD;


	var hours = 0, minutes = 0, seconds = 0;
	if (time) {
		ar = str.split('-');
		if (ar.length < 2 || ar.length > 3) {
			return DateTime.NaD;
		}
		hours = parseInt(ar[0]);
		if (isNaN(hours)) return DateTime.NaD;
		minutes = parseInt(ar[1]);
		if (isNaN(minutes)) return DateTime.NaD;
		if (ar.length === 3) {
			seconds = parseInt(ar[2]);
			if (isNaN(seconds)) return DateTime.NaD;
		}
	}

	return new DateTime(year, month, day, hours, min, seconds);
}
