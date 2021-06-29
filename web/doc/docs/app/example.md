# Application Data and Services Example

```jsq
import "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css";

import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import qSpinner from '@qutejs/spinner';

const { View, Name, Template, Prop, Inject, Provide } = Qute;

<q:style>
.tbar {
    list-style:none;
    padding: 0;
    margin: 0;
}
.tbar > li {
    display: inline-block;
    padding: 2px 2px;
    margin: 0 4px;
}
.tbar > li.active {
    border-bottom: 1px solid green;
}
.tbar a, .tbar a:hover, .tbar a:active {
    text-decoration: none;
}
.main {
    margin-left: 6px;
    margin-top: 10px;
}
</q:style>

<q:template name='PagePlaceholder'>
    <div>Click on the tab bar to open a page</div>
</q:template>
<q:template name='PageOne'>
    <div>Page 1 content</div>
</q:template>
<q:template name='PageTwo'>
    <div>Page 2 content</div>
</q:template>
<q:template name='PageThree'>
    <div>Page 3 content</div>
</q:template>

<q:template name='RootTemplate'>
    <div>
        <div class='clearfix'>
            <ul class='tbar' style='float:left' @click='onTabClick'>
                <li><a href='#' data-key='page1'>Page 1</a></li>
                <li><a href='#' data-key='page2'>Page 2</a></li>
                <li><a href='#' data-key='page3'>Page 3</a></li>
            </ul>
            <div style='float:right'>
                <if value='user'>
                Hello {{user}}!
                <button class='btn btn-primary' @click='logout'>Logout</button>
                <else />
                <q:spinner size='8px' inline q:show='loginPending'/>
                <button class='btn btn-primary' @click='login' q:toggle-disabled={loginPending}>Login</button>
                </if>
            </div>
        </div>
        <div class='main'>
            <view is={currentPage} />
        </div>
    </div>
</q:template>

var pages = {
    page1: PageOne,
    page2: PageTwo,
    page3: PageThree
}

@Template(RootTemplate)
class RootView extends Qute.ViewModel {
    @Inject('Session/user') user;
    @Inject('Session/user/pending') loginPending;
    @Inject('Session/user/error') loginError;
    @Inject('Pages/current') currentPage;
    @Inject('Session') session;

    login() {
        this.session.login('Foo');
    }

    logout() {
        this.session.logout();
    }

    onTabClick(e) {
        var page = pages[e.target.getAttribute('data-key')]
        if (page) {
            e.currentTarget.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            e.target.closest('li').classList.add('active');
            this.currentPage = page;
        }
    }
}

class SessionManager extends Qute.Service {
    @Provide('Session/user') user;
    @Provide('Session/user/pending') pending = false;
    @Provide('Session/user/error') error;

    login(user) {
        // simulate login
        this.pending = true;
        window.setTimeout(() => {
            this.user = user;
            this.pending = false;
        }, 1000);
    }

    logout() {
        this.user = null;
        this.pending = false;
    }
}

class PageManager extends Qute.Service {
    @Provide('Pages/current') currentPage;

    open(page) {
        this.currentPage = page;
    }

    close() {
        this.currenPage = null;
    }
}

@View(RootView)
class MyApp extends Qute.Application {
  @Provide('Session')
  session = new SessionManager(this);

  @Provide('Pages')
  pages = new PageManager(this);
}

new MyApp().mount('app');
```
