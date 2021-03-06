
// (c) 2013 Wiley Bennett
// v 1.0.0
//
// UI render calls and general interaction
//
// RENDER
//      Binned Country Scale
//      Timespan Slider
//      Casualty Slider
//      Disaster Filter
//      Country Data Window
//      Get Disaster Locaion (retieve.php)
//      Help Windows
//      Zoom in to Country Window
//      Zoom out of Country Window
//      Page Signature

//---------------------------------------------------------------------------------- Binned Country Scale ---------------------------------

World.SVG.prototype.renderScale = function() {
    var this_ = this;
    d3.select("body")
        .append("div")
        .attr("id", "map-scale-box")
        .attr("class", "map-box");
        //$('#map-scale-box').draggable({distance: 10});
            
    d3.select("#map-scale-box")
        .append("span")
        .attr("class", "map-scale-units");
            
    d3.select("#map-scale-box")
        .append("div")
        .attr("id", "map-scale-picker");
    
    $.each(this_.cDataMeta, function(k,v) {
        d3.select("#map-scale-picker")
            .append("div")
            .attr("id", k+"ID")
            .attr("class", "map-scale-choice")
            .html(v.tooltip.replace(/: /g, ""));
    });
    $('#'+this_.cData+"ID").addClass('map-scale-choice-selected');
        
    this.updateScale();
        
    $(document).delegate(".map-scale-bin", "mouseenter", function() {
        this_.curBin = $(this).attr("class");
        this_.curBin = this_.curBin.split(" ");
        this_.curBin = this_.curBin[0];
            
        this_.selCont = [];
            $.each(this_.countries, function(k,v) {
                if (v.bin == this_.curBin)
                    this_.selCont.push(v);
            });    
        
        d3.selectAll('.'+this_.curBin)
            .classed("selected", true);
            
        $('.'+this_.curBin+'-label').show();
            
    });
    
    $(document).delegate(".map-scale-bin", "mouseleave", function() {
        var bin = $(this).attr("class");
        bin = bin.split(" ");
        bin = bin[0];
        d3.selectAll('.'+bin)
            .classed("selected", false);
        $('.country-label').hide();
    });
    
    $(document).delegate(".map-scale-choice", "click", function() {
        $('.map-scale-choice').removeClass('map-scale-choice-selected');
        $(this).addClass('map-scale-choice-selected');
        var cur = $(this).attr("id").replace(/ID/g, "");
        this_.cData = cur;
        this_.updateCountries();
        this_.updateScale();
    });
}

World.SVG.prototype.updateScale = function() {
    var this_ = this;
    
    d3.selectAll(".map-scale-bin").remove();
    d3.selectAll(".map-scale-value").remove();
    
    d3.select(".map-scale-units").html(this_.cDataMeta[this_.cData].units);
    
    d3.select("#map-scale-box")
        .append("div")
        .attr("class", "map-scale-value map-scale-high")
        .html(addCommas(this_.cDataMeta[this_.cData].binHigh));
    d3.select("#map-scale-box")
        .append("div")
        .attr("class", "map-scale-value map-scale-low")
        .html(addCommas(this_.cDataMeta[this_.cData].binLow));
    
    for (var i=this_.binRange-1; i>=0;i--) {
        var step = (this_.cDataMeta[this_.cData].binHigh-this_.cDataMeta[this_.cData].binLow)/this_.binRange;
        d3.select("#map-scale-box")
            .append("div")
            .attr("class", function(d) { return "map-scale-bin "+((this_.cData!="blank")?("q"+i):"");})
            .attr("title", (addCommas(parseInt(this_.cDataMeta[this_.cData].binLow)+Math.floor(i*step*10)/10))+" - "+(addCommas(parseInt(this_.cDataMeta[this_.cData].binLow)+Math.floor((i+1)*step*10)/10))+(((i+1)==this_.binRange)?"+":""));
    }

}

//---------------------------------------------------------------------------------- Timespan Slider ---------------------------------

World.SVG.prototype.renderTimeSlider = function() {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "map-time-box")
        .attr("class", "map-box");
        //$('.map-box').draggable({distance: 10});

    d3.select("#map-time-box")
        .append("span")
        .attr("class", "slider-label")
        .text("Timespan");
        
    d3.select("#map-time-box")
        .append("div")
        .attr("id", "map-time-amount");
    
    d3.select("#map-time-box")
        .append("span")
        .attr("id", "map-time-play")
        .attr("class", "action button")
        .attr("title", "Play Time Animation")
        .html(this_.icon.play);
    
    d3.select("#map-time-box")
        .append("span")
        .attr("id", "map-time-reset")
        .attr("class", "action")
        .html("Reset");
    
    d3.select("#map-time-box")
        .append("div")
        .attr("id", "map-time")
        
    d3.select("#map")
        .append("div")
        .attr("id", "map-time-watermark")
        .attr("style", "font-size:"+($(window).height()/6)+"px");
        
    var min = 1,
        max = 1308;
        
    $(function() {
        var ob = {
            range: true,
            min: min,
            max: max,
            step: 1,
            animate: 150,
            values: [getNumFromDate(this_.openDate), getNumFromDate(this_.closeDate)],
            slide: function(event, ui) {
                changeSlide(event, ui);
            },
            change: function(event, ui) {
                changeSlide(event, ui);
            }
        };
            function changeSlide(e, ui) {
                $("#map-time-amount").html(getReadableMY(getDate(ui.values[0]))+"&nbsp; &mdash; &nbsp;"+getReadableMY(getDate(ui.values[1])));
                this_.openDate = getDate(ui.values[0]);
                this_.closeDate = getDate(ui.values[1]);
                this_.updateDisasters();
            }
        
        $("#map-time").slider(ob);
        $("#map-time-amount").html(getReadableMY(this_.openDate)+"&nbsp; &mdash; &nbsp;"+getReadableMY(this_.closeDate));
    });
    
    $(document).delegate('#map-time-play', 'click', function() {
        var tSpan = 5; // years
        if (getNumFromDate(this_.closeDate)-getNumFromDate(this_.openDate) != tSpan*12 || this_.closeDate[2] == 2010) {
            this_.openDate = [1,1,1900];
            this_.closeDate = [this_.openDate[0],this_.openDate[1],this_.openDate[2]+tSpan];
        }
        var $this = $(this);
        if (!$(this).hasClass("play")) {
            $(this).html(this_.icon.pause).addClass("play");
            $('#map-time-watermark').show();
            this_.play = setInterval(function() {
                if (getNumFromDate(this_.closeDate) >= max) {
                    this_.stopAnimation();
                    $('#map-time').slider("values", [min, max]);
                } else {
                    $('#map-time-watermark').html(this_.closeDate[2]);
                    var vals = [getNumFromDate(this_.openDate), getNumFromDate(this_.closeDate)];
                    $('#map-time').slider("values", vals);
                    d3.selectAll('.disaster-loc')
                        .classed("loc-filter-hover", true);
                    this_.openDate = getDate(2+getNumFromDate(this_.openDate));
                    this_.closeDate = getDate(2+getNumFromDate(this_.closeDate));
                }
            }, 10);
        } else {
            this_.stopAnimation();
        }
    });
    
    $(document).delegate('#map-time-reset', 'click', function() {
        this_.stopAnimation();
        $('#map-time').slider("values", [getNumFromDate(this_.reset.time.openDate), getNumFromDate(this_.reset.time.closeDate)]);
    });
    
}

World.SVG.prototype.stopAnimation = function() {
    var this_ = this;
    $('#map-time-play').html(this_.icon.play).removeClass("play");
        d3.selectAll('.disaster-loc')
            .classed("loc-filter-hover", false);
        clearInterval(this_.play);
        $('#map-time-watermark').html("").hide();
}

//---------------------------------------------------------------------------------- Casualty Slider ---------------------------------

World.SVG.prototype.renderCasualtiesSlider = function() {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "map-casualties-box")
        .attr("class", "map-box");

    d3.select("#map-casualties-box")
        .append("span")
        .attr("class", "slider-label")
        .text("Casualties");
        
    d3.select("#map-casualties-box")
        .append("span")
        .attr("id", "map-casualties-amount");
        
    d3.select("#map-casualties-box")
        .append("div")
        .attr("id", "map-casualties")
    
    $(function() {
        var ob = {
            range: true,
            min: log10(this_.absMinCas),
            max: log10(6000010),
            step: .00001,
            animate: 200,
            values: [log10(this_.minCas), log10(this_.maxCas)],
            slide: function(event, ui) {
                var factor;
                var val = [Math.pow(10, ui.values[0]), Math.pow(10, ui.values[1])];
                $("#map-casualties-amount").html(addCommas(roundTo(val[0]))+"&nbsp; &mdash; &nbsp;"+addCommas(roundTo(val[1])));
                this_.minCas = roundTo(val[0]);
                this_.maxCas = roundTo(val[1]);
                this_.updateDisasters();
            },
            stop: function(event, ui) {
//                var factor;
//                var val = [Math.pow(10, ui.values[0]), Math.pow(10, ui.values[1])];
//                $("#map-slider-amount").html(addCommas(roundTo(val[0]))+" - "+addCommas(roundTo(val[1])));
//                this_.updateDisasters(roundTo(val[0]), roundTo(val[1]));
            }
        };
        $("#map-casualties").slider(ob);
        $("#map-casualties-amount").html(addCommas(this_.minCas)+"&nbsp; &mdash; &nbsp;"+addCommas(this_.maxCas));
    });    
}

//---------------------------------------------------------------------------------- Disaster Filter ---------------------------------

World.SVG.prototype.renderFilter = function () {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "map-filter-box")
        .attr("class", "map-box");
        $('#map-filter-box').draggable({distance: 10});
        
    d3.select("#map-filter-box")
        .append("div")
        .attr("class", "map-filter-title")
        .text("Disaster Type");
        
    d3.select("#map-filter-box")
        .append("div")
        .attr("id", "map-filters");
        
    d3.select("#map-filters")
            .append("div")
            .attr("id", "filter-all")
            .attr("class", "action")
            .text(((this_.filters.length == 0)?"Select All":"Clear All"));
            
    this.filterSet.forEach(function(d) {
        d3.select("#map-filters")
            .append("div")
            .attr("class", "map-filter"+(($.inArray(d,this_.filters) >= 0)?" map-filter-checked":""))
            .attr("id", "type-"+d.replace(/ /g, "-"))
            .html(d+'<span class="filter-color clear-back '+(($.inArray(d,this_.filters) >= 0)?"":"hidden")+' '+d.replace(/ /g, "-").toLowerCase()+'-loc">&nbsp;</span>');
    });

    $(document).delegate(".map-filter", "click", function() {
        if ($(this).hasClass('map-filter-checked')) {
            $(this).removeClass('map-filter-checked');
            $(this).find('.filter-color').addClass("hidden");
            if (!$('.map-filter').hasClass('map-filter-checked')) {
                $('#filter-all').html("Select All");
            }
        } else {
            $(this).addClass('map-filter-checked');
            $('#filter-all').html("Clear All");
            $(this).find('.filter-color').removeClass("hidden");
        }
        this_.setFilterVals();
        this_.updateDisasters();
    });
    $(document).delegate(".map-filter", "mousemove mouseleave", function(e) {
        if (e.type === 'mousemove') {
            if ($(this).hasClass('map-filter-checked')) {
                $('.filter-color').stop(true).fadeOut();
                $(this).find('.filter-color').removeClass("clear-back").stop(true, true).show();
                d3.selectAll('.disaster-loc')
                    .classed("hidden-loc", true);
                var val = '.'+$(this).attr("id").substr(5).toLowerCase()+'-loc';
                d3.selectAll(val)
                    .classed("loc-filter-hover", true)
                    .classed("hidden-loc", false);
            }
        } else {
            $('.filter-color').stop(true, true).fadeIn();
            $(this).find('.filter-color').addClass("clear-back");
            var val = '.'+$(this).attr("id").substr(5).toLowerCase()+'-loc';
            d3.selectAll(val)
                .classed("loc-filter-hover", false);
            d3.selectAll('.disaster-loc')
                .classed("hidden-loc", false);
        }
    });
    $(document).delegate("#filter-all", "click", function() {
        if ($('.map-filter').hasClass('map-filter-checked')) {
            $(this).html("Select All");
            $('.map-filter').removeClass('map-filter-checked');
            $('.filter-color').addClass("hidden");
            this_.setFilterVals("clear");
        } else {
            $(this).html("Clear All");
            $('.map-filter').addClass('map-filter-checked');
            $('.filter-color').removeClass("hidden");
            this_.setFilterVals("all");
        }
        this_.updateDisasters();
    });
    
    this_.setFilterVals();
}

World.SVG.prototype.setFilterVals = function(filter) {
    var this_ = this;
    this_.filters = [];
    if (filter) {
        if (filter == "all") {
            this_.filters = this_.filterSet;
        }
    } else {
        $('.map-filter-checked').each(function(k,v) {
            var val = $(this).attr("id").substr(5);
            this_.filters.push(val);
        });
    }
}

//---------------------------------------------------------------------------------- Country Data Window ---------------------------------

World.SVG.prototype.renderCountryWindow = function() {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("class", "map-box")
        .attr("id", "country-data-box");
        
    d3.select("#country-data-box")
        .append("div")
        .attr("class", "x")
        .attr("title", "Zoom Out")
        .html('<div class="x-for"></div><div class="x-back"></div>')
        .on("click", function() {
            this_.zoomOut();
        });
        
    d3.select("#country-data-box")
        .append("div")
        .attr("class", "country-data-title");
        
    d3.select("#country-data-box")
        .append("div")
        .attr("class", "country-data-content")
        .html('<table class="country-data-content-table"></table>');
}

World.SVG.prototype.showCountryWindow = function(c) {
    var this_ = this;
    
    $('#country-data-box').fadeIn();
    $('.country-data-title').html(c.name);
    
    var content = "";
    $.each(this_.cDataMeta, function(k,v) {
        if (k != "blank")
            content += '<tr><td>'+v.tooltip.replace(/: /g, "")+'</td><td>'+v.pre+'<b>'+c[k]+'</b>'+v.suf+'</td></tr>';
    });
    
    $('.country-data-content-table').html(content);
}

World.SVG.prototype.hideCountryWindow = function(c) {
    var this_ = this;
    
    $('#country-data-box').hide();
    $('.country-data-title').html("");
    $('.country-data-content-table').html("");
}

//---------------------------------------------------------------------------------- Get Disaster Location Name ---------------------------------

World.SVG.prototype.getDisasterLoc = function(d) {
    var this_ = this;
    var lat = parseFloat(d.lat),
        lng = parseFloat(d.lng);
    $.post('retrieve.php', {lat: lat, lng: lng}, function(json) {
        if (json.status == "OK") {
            var set = json.results.splice(json.results.length-2, 1).reverse();
            this_.curLoc = set[0].formatted_address.split(", ")[0]+', ';
            $('#disaster-subLoc').html(this_.curLoc);
        } else {
            $('#disaster-subLoc').html("");
        }
    }, "json");
}

//---------------------------------------------------------------------------------- Help Windows ---------------------------------

World.SVG.prototype.renderHelp = function() {
    d3.select("body")
        .append("div")
        .attr("id", "esc-zoom-out")
        .html('Press Esc <br /> to zoom out');
}

World.SVG.prototype.showHelp = function() {
    if (!$('#esc-zoom-out').is(':visible'))
        $('#esc-zoom-out').show().css({left: "-200px"}).animate({left:"0px"}).fadeTo("slow", .3);
}

//---------------------------------------------------------------------------------- Zoom In to Individual Country View ---------------------------------

World.SVG.prototype.zoomIn = function(d, self) {
    var this_ = this;
    
    //$('.country-label').css("fill", "#999");
    //$('.country-label').css("font-size", "9px").hide();
    
    this.showCountryWindow(d);
    d3.selectAll('.country')
        .classed("country-focus", false);
    d3.select(self).classed("country-focus", true);

    var cent = this_.path.centroid(d);
    var box = self.getBBox();
    this_.zoomSF = this_.getCScaleFactor(d, box);
    var zoomX = -(cent[0] - this_.width/2/this_.zoomSF),
        zoomY = -(cent[1] - this_.height/2/this_.zoomSF);
        
    this.g.transition().duration(800).each("end", this_.showHelp)
        .attr("transform", "scale(" + this_.zoomSF + ")" +" translate(" + (zoomX+this_.x/this_.zoomSF) + "," + (zoomY+this_.y/this_.zoomSF) + ")");

    d.selected = true;
    //$('#'+d.name.replace(/ /g, "_").replace(/\'/g, "-apos-").replace(/\&/g, "-amp-")+'-label').css("font-size", 30/this_.zoomSF+"px").show();

    this_.cFilter = d.name;
    this_.updateDisasters();
}

//---------------------------------------------------------------------------------- Zoom Out of Individual Country View ---------------------------------

World.SVG.prototype.zoomOut = function() {
    var this_ = this;
    d3.selectAll('.country')
        .classed("country-focus", false);
    this.hideCountryWindow();
    this.g.transition().duration(800)
        .attr("transform", "scale(1) translate("+this_.x+","+this_.y+")");
    //$('.country-label').hide();
    //$('.country-label').css("fill", "#000");
    this_.cFilter = null;
    this_.zoomSF = 1;
    this_.updateDisasters(null, true);
    $('#esc-zoom-out').fadeTo("fast", 1).hide();
}

//---------------------------------------------------------------------------------- Creator's Signature ---------------------------------

World.SVG.prototype.renderSignature = function() {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "signature")
        .html('&copy; 2013 <span class="action">Wiley Bennett</a>');
    
    $(document).delegate("#signature", "click", function() {
        window.open("http://w.bmdware.com/portfolio/");
        window.focus();
    });
    
}