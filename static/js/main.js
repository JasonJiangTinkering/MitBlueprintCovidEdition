'use strict';
$(window).on('load', function() {
    $(".loader").fadeOut();
    $("#preloder").delay(400).fadeOut("slow");
    var $container = $('.isotope_items');
    $container.isotope();
    $('.portfolio-filter li').on("click", function() {
        $(".portfolio-filter li").removeClass("active");
        $(this).addClass("active");
        var selector = $(this).attr('data-filter');
        $(".isotope_items").isotope({
            filter: selector,
            animationOptions: {
                duration: 750,
                easing: 'linear',
                queue: false,
            }
        });
        return false;
    });
});
(function($) {
    var navMenu = $('.menu-list')
    navMenu.onePageNav();
    $(window).on('scroll resize', function(e) {
        if ($(this).scrollTop() > 70) {
            $('.header-section').addClass('sticky');
        } else {
            $('.header-section').removeClass('sticky');
        }
        e.preventDefault();
    });
    $('.responsive').on('click', function(event) {
        $('.menu-list').slideToggle(400);
        $('.header-section').toggleClass('bgc');
        event.preventDefault();
    });
    $('.menu-list li a').on('click', function(event) {
        if ($(window).width() < 768) {
            $('.menu-list').slideUp(400);
            $('.header-section').removeClass('bgc');
        }
    });
    $(".element").typed({
        strings: ["Welcome To Floom", "Web Conferencing With Real Time Attention Detection", "Start By Entering Your Name Below"],
        typeSpeed: 10,
        loop: true,
        backDelay: 1000
    });
    var fh = $('.footer-section').height();
    fh = fh + 140;
    $('.main-warp').css('margin-bottom', fh);
    $('.progress-bar-style').each(function() {
        var progress = $(this).data("progress");
        var prog_width = progress + '%';
        if (progress <= 100) {
            $(this).append('<div class="bar-inner" style="width:' + prog_width + '"><span>' + prog_width + '</span></div>');
        } else {
            $(this).append('<div class="bar-inner" style="width:100%"><span>100%</span></div>');
        }
    });
    $('#review-carousel').owlCarousel({
        dots: false,
        nav: true,
        loop: true,
        margin: 30,
        smartSpeed: 700,
        items: 1,
        autoplay: true,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>']
    });
    $('.work-item').magnificPopup({
        type: 'image',
        gallery: {
            enabled: true
        },
        removalDelay: 400,
        zoom: {
            enabled: true,
            duration: 300
        }
    });
    new WOW().init();
    $('#contact-form').on('submit', function() {
        var send_btn = $('#send-form'),
            form = $(this),
            formdata = $(this).serialize(),
            chack = $('#form-chack');
        send_btn.text('Wait...');

        function reset_form() {
            $("#name").val('');
            $("#email").val('');
            $("#massage").val('');
        }
        $.ajax({
            url: $(form).attr('action'),
            type: 'POST',
            data: formdata,
            success: function(text) {
                if (text == "success") {
                    send_btn.addClass('done');
                    send_btn.text('Success');
                    setTimeout(function() {
                        reset_form();
                        send_btn.removeClass('done');
                        send_btn.text('Massage');
                    }, 2500);
                } else {
                    reset_form();
                    send_btn.addClass('error');
                    send_btn.text('Error');
                    setTimeout(function() {
                        send_btn.removeClass('error');
                        send_btn.text('Massage');
                    }, 5000);
                }
            }
        });
        return false;
    });
})(jQuery);
